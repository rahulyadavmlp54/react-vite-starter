import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLoader } from "../context/LoaderContext";
import Swal from "sweetalert2";
import { Modal, Button, Form } from "react-bootstrap";

export default function UsersList() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
        role: "user",
    });

    const { showLoader, hideLoader } = useLoader();

    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch all users
    const fetchUsers = async () => {
        showLoader("Loading all users...");
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setUsers(data);
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };

    // Handle form input
    const handleChange = (e) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    // Handle adding new user
    const handleAddUser = async (e) => {
        e.preventDefault();
        showLoader("Creating user...");

        try {
            // 1️⃣ Create Auth user
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
            });

            if (signUpError) throw signUpError;

            const userId = signUpData?.user?.id;
            if (!userId) throw new Error("User creation failed");

            // 2️⃣ Create matching profile manually
            // Profile row is auto-created by trigger — we only need to update it
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    phone_number: newUser.phone_number,
                    role: newUser.role,
                })
                .eq("id", userId);


            if (profileError) throw profileError;

            Swal.fire("✅ Success", `${newUser.role} added successfully!`, "success");
            setShowModal(false);
            setNewUser({
                first_name: "",
                last_name: "",
                email: "",
                phone_number: "",
                password: "",
                role: "user",
            });
            fetchUsers();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            hideLoader();
        }
    };


    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-primary">👥 Registered Users</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    ➕ Add User
                </button>
            </div>

            {users.length === 0 ? (
                <p className="text-muted">No users found.</p>
            ) : (
                <div className="table-responsive shadow-sm">
                    <table className="table table-bordered align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>Sr.No</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Registered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={u.id}>
                                    <td>{i + 1}</td>
                                    <td>{`${u.first_name || ""} ${u.last_name || ""}`}</td>
                                    <td>{u.email}</td>
                                    <td>{u.phone_number || "-"}</td>
                                    <td>
                                        <span
                                            className={`badge bg-${u.role === "admin"
                                                ? "danger"
                                                : u.role === "owner"
                                                    ? "primary"
                                                    : "secondary"
                                                }`}
                                        >
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ➕ Add User Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddUser}>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    name="first_name"
                                    value={newUser.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    name="last_name"
                                    value={newUser.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={newUser.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                                name="phone_number"
                                value={newUser.phone_number}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={newUser.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                name="role"
                                value={newUser.role}
                                onChange={handleChange}
                            >
                                <option value="user">User</option>
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Create User
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
