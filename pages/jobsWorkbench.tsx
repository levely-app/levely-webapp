import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../utils/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../utils/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';


interface JobData {
    id: string;
    name: string;
    description: string;
    analysis?: string;
    rewrittenResume?: string;
}

export default function JobsWorkbench() {
    const [user] = useAuthState(auth);
    const [jobList, setJobList] = useState<JobData[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'jobs'), (snapshot) => {
            const newJobs: JobData[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as JobData));
            setJobList(newJobs);
        });

        return () => {
            unsub();
        };
    }, []);

    const handleReturn = () => {
        router.push('/dashboard');
    };

    const handleAddNew = () => {
        setJobName("");
        setJobDescription("");
        setSelectedJob(null);
        setShowForm(true);
    };

    const handleRemove = async () => {
        if (selectedJob) {
            await deleteDoc(doc(db, 'jobs', selectedJob.id));
            setSelectedJob(null); // Add this line
            setShowForm(false); // Hide the form
        }
    };

    const handleSave = async () => {
        if (selectedJob) {
            await updateDoc(doc(db, 'jobs', selectedJob.id), { name: jobName, description: jobDescription });
        } else {
            await addDoc(collection(db, 'jobs'), { name: jobName, description: jobDescription });
        }
        setShowForm(false);
    };

    const handleEdit = (job: JobData) => {
        setSelectedJob(job);
        setJobName(job.name);
        setJobDescription(job.description);
        setShowForm(true);
    };

    return (
        <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Jobs Workbench</h1>
                <span>Logged in as {user ? user.email : "Loading..."}</span>
                <button className="btn btn-info ml-3" onClick={handleReturn}>Return</button>
            </div>
            <p>Manage your job descriptions and analyses here.</p>

            <div className="row">
                <div className="col-4">
                    <h3>Job List</h3>
                    <p>Click to select a job for editing.</p>
                    <button className="btn btn-secondary mb-3" onClick={handleAddNew}>Add New</button>
                    <ul className="list-group">
                        {jobList.map((job, index) => (
                            <li
                                key={job.id}
                                className={`list-group-item ${selectedJob?.id === job.id ? "active" : ""}`}
                                onClick={() => handleEdit(job)}
                            >
                                {job.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="col-8">
                    <h3>Job Details</h3>
                    <p>Edit the selected job or add a new one.</p>
                    {showForm && (
                        <div>
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Job Name"
                                value={jobName}
                                onChange={(e) => setJobName(e.target.value)}
                            />
                            <textarea
                                className="form-control mb-2"
                                placeholder="Job Description"
                                rows={5}
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                            <hr />
                            <button className="btn btn-primary mb-2">Analyze</button>
                            <textarea
                                className="form-control mb-2"
                                placeholder="Job Analysis"
                                rows={5}
                            />
                            <div className="mb-2">
                                <button className="btn btn-primary" style={{ marginRight: '8px' }}>Rewrite Resume</button>
                                <button className="btn btn-warning">Copy</button>
                            </div>
                            <textarea
                                className="form-control mb-2"
                                placeholder="Rewritten Resume"
                                rows={5}
                            />
                            <div className="mt-2">
                                <button className="btn btn-success" style={{ marginRight: '8px' }} onClick={handleSave}>Save</button>
                                <button className="btn btn-danger" onClick={handleRemove}>Delete</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

}
