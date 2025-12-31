import React, { useState, useEffect, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaSave,
  FaTrash,
  FaFileExcel,
  FaHome,
  FaUserTag,
  FaUser,
  FaTachometerAlt,
  FaMoneyBillWave
} from "react-icons/fa";
import * as XLSX from "xlsx";

import Navbar from "../../Components/Sidebar/Navbar";
import "./Members.scss";
import "react-toastify/dist/ReactToastify.css";

const Members = () => {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.toLowerCase().trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ================= FETCH MEMBERS ================= */
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/member/get-members`
        );
        const data = await res.json();
        setMembers(data);
      } catch {
        toast.error("Failed to fetch members");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, []);

  /* ================= FILTER ================= */
  const filteredMembers = useMemo(() => {
    if (!debouncedSearch) return members;
    return members.filter(m =>
      m.flatNumber?.toLowerCase().includes(debouncedSearch) ||
      m.name?.toLowerCase().includes(debouncedSearch)
    );
  }, [members, debouncedSearch]);

  /* ================= FORM ================= */
  const initialValues = {
    flatNumber: "",
    type: "OWNER",
    name: "",
    mobile: "",
    email: "",
    unitsUsed: 0,
    pendingAmount: 0,
  };

  const validationSchema = Yup.object({
    flatNumber: Yup.string().required("Flat Number is required"),
    type: Yup.string().required("Type is required"),
    name: Yup.string().required("Name is required"),
    mobile: Yup.string().matches(/^[0-9]{10}$/, "Must be 10 digits").optional(),
    email: Yup.string().email("Invalid email format").optional(),
    unitsUsed: Yup.number().min(0, "Must be positive").optional(),
    pendingAmount: Yup.number().min(0, "Must be positive").optional(),
  });

  const handleSubmit = async (values, { resetForm, setFieldError }) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/member/create-member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.field) setFieldError(data.field, data.message);
        throw new Error(data.message);
      }

      setMembers(prev => [data, ...prev]);
      toast.success("Member added successfully");
      resetForm();
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= UPDATE ================= */
  const updateMember = async (member) => {
    try {
      const payload = { ...member };
      delete payload.createdAt;
      delete payload.updatedAt;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/member/update-member/${member.memberId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      const updated = await res.json();
      setMembers(prev =>
        prev.map(m => (m.memberId === updated.memberId ? updated : m))
      );
      toast.success("Member updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update member");
    }
  };

  /* ================= DELETE ================= */
  const deleteMember = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/member/delete-member/${id}`,
        { method: "DELETE" }
      );
      setMembers(prev => prev.filter(m => m.memberId !== id));
      setSelectedMember(null);
      toast.success("Member deleted successfully");
    } catch {
      toast.error("Failed to delete member");
    }
  };

  /* ================= BULK IMPORT ================= */
  const handleBulkImport = async (file) => {
    if (!file) return;

    setIsBulkLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const members = rows.map(r => ({
          flatNumber: r["Flat Number"],
          type: r["Type"] || "OWNER",
          name: r["Name"],
          mobile: r["Mobile"] || "",
          email: r["Email"] || "",
          unitsUsed: Number(r["Units Used"] || 0),
          pendingAmount: Number(r["Pending Amount"] || 0),
        }));

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/member/bulk-create-members`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ members }),
          }
        );

        const result = await res.json();
        setMembers(prev => [...result.result.successful, ...prev]);

        toast.success(
          `Imported: ${result.result.successful.length} success, ${result.result.failed.length} failed`
        );
        setShowBulkImport(false);
      } catch {
        toast.error("Bulk import failed");
      } finally {
        setIsBulkLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  /* ================= BULK IMPORT MODAL ================= */
  const BulkImportModal = () => (
    <div className="modal-overlay" onClick={() => !isBulkLoading && setShowBulkImport(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Bulk Import Members</h3>
          {!isBulkLoading && (
            <button className="close-btn" onClick={() => setShowBulkImport(false)}>×</button>
          )}
        </div>
        <div className="modal-body">
          <p>Upload an Excel file with the following columns:</p>
          <ul>
            <li>Flat Number (required)</li>
            <li>Name (required)</li>
            <li>Type (OWNER/RENT)</li>
            <li>Mobile</li>
            <li>Email</li>
            <li>Units Used</li>
            <li>Pending Amount</li>
          </ul>

          <div className="file-upload-area">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleBulkImport(e.target.files[0])}
              disabled={isBulkLoading}
            />
            {isBulkLoading && <p>Importing...</p>}
          </div>
        </div>
      </div>
    </div>
  );

  /* ================= MEMBER DETAILS MODAL ================= */
  const MemberModal = ({ member }) => {
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...member });

    const handleSave = () => {
      updateMember(formData);
      setEditMode(false);
    };

    return (
      <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">{editMode ? "Edit Member" : "Member Details"}</h3>
            <button className="close-btn" onClick={() => setSelectedMember(null)}>×</button>
          </div>

          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-row">
                <div className="detail-label">
                  <FaHome /> Flat Number
                </div>
                <div className="detail-value">
                  {editMode ? (
                    <input
                      value={formData.flatNumber}
                      onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                      className="modal-input"
                    />
                  ) : (
                    member.flatNumber
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">
                  <FaUserTag /> Type
                </div>
                <div className="detail-value">
                  {editMode ? (
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="modal-select"
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="RENT">RENT</option>
                    </select>
                  ) : (
                    member.type
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">
                  <FaUser /> Name
                </div>
                <div className="detail-value">
                  {editMode ? (
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="modal-input"
                    />
                  ) : (
                    member.name
                  )}
                </div>
              </div>

              {/* Mobile Field - ALWAYS SHOW (not conditional) */}
              <div className="detail-row">
                <div className="detail-label">Mobile</div>
                <div className="detail-value">
                  {editMode ? (
                    <input
                      value={formData.mobile || ""}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="modal-input"
                      placeholder="Enter mobile number"
                    />
                  ) : (
                    member.mobile || "Not provided"
                  )}
                </div>
              </div>

              {/* Email Field - ALWAYS SHOW (not conditional) */}
              <div className="detail-row">
                <div className="detail-label">Email</div>
                <div className="detail-value">
                  {editMode ? (
                    <input
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="modal-input"
                      type="email"
                      placeholder="Enter email address"
                    />
                  ) : (
                    member.email || "Not provided"
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">
                  <FaTachometerAlt /> Units Used
                </div>
                <div className="detail-value">
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.unitsUsed}
                      onChange={(e) => setFormData({ ...formData, unitsUsed: e.target.value })}
                      className="modal-input"
                      min="0"
                    />
                  ) : (
                    member.unitsUsed
                  )}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">
                  <FaMoneyBillWave /> Pending Amount
                </div>
                <div className="detail-value">
                  {editMode ? (
                    <input
                      type="number"
                      value={formData.pendingAmount}
                      onChange={(e) => setFormData({ ...formData, pendingAmount: e.target.value })}
                      className="modal-input"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    `₹${member.pendingAmount}`
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className={editMode ? "save-btn" : "update-btn"}
              onClick={editMode ? handleSave : () => setEditMode(true)}
            >
              {editMode ? <><FaSave /> Save Changes</> : <><FaEdit /> Edit</>}
            </button>
            <button
              className="delete-btn"
              onClick={() => deleteMember(member.memberId)}
            >
              <FaTrash /> Delete Member
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Navbar>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="members-container">
        <div className="page-header">
          <h2>.</h2>
          <div className="header-controls">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by flat number or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="action-buttons-group">
              {/* <button
                className="bulk-import-btn"
                onClick={() => setShowBulkImport(true)}
                disabled={isBulkLoading}
              >
                <FaFileExcel /> Bulk Import
              </button> */}
              <button
                className="add-btn"
                onClick={() => setShowForm(!showForm)}
              >
                <FaPlus /> {showForm ? "Close Form" : "Add Member"}
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="form-container premium">
            <h2>Add New Member</h2>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched }) => (
                <Form>
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="flatNumber">
                        <FaHome /> Flat Number *
                      </label>
                      <Field
                        name="flatNumber"
                        id="flatNumber"
                        placeholder="Enter flat number"
                        className={errors.flatNumber && touched.flatNumber ? 'error-field' : ''}
                      />
                      <ErrorMessage name="flatNumber" component="div" className="error" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="type">
                        <FaUserTag /> Type *
                      </label>
                      <Field as="select" name="type" id="type" className="select-field">
                        <option value="OWNER">OWNER</option>
                        <option value="RENT">RENT</option>
                      </Field>
                      <ErrorMessage name="type" component="div" className="error" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="name">
                        <FaUser /> Full Name *
                      </label>
                      <Field
                        name="name"
                        id="name"
                        placeholder="Enter member's full name"
                        className={errors.name && touched.name ? 'error-field' : ''}
                      />
                      <ErrorMessage name="name" component="div" className="error" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="mobile">Mobile Number</label>
                      <Field
                        name="mobile"
                        id="mobile"
                        placeholder="Enter 10-digit mobile number"
                      />
                      <ErrorMessage name="mobile" component="div" className="error" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="email">Email Address</label>
                      <Field
                        name="email"
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                      />
                      <ErrorMessage name="email" component="div" className="error" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="unitsUsed">
                        <FaTachometerAlt /> Units Used
                      </label>
                      <Field
                        name="unitsUsed"
                        id="unitsUsed"
                        type="number"
                        placeholder="Enter units used"
                        min="0"
                      />
                      <ErrorMessage name="unitsUsed" component="div" className="error" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="pendingAmount">
                        <FaMoneyBillWave /> Pending Amount
                      </label>
                      <Field
                        name="pendingAmount"
                        id="pendingAmount"
                        type="number"
                        placeholder="Enter pending amount"
                        min="0"
                      />
                      <ErrorMessage name="pendingAmount" component="div" className="error" />
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? "Adding Member..." : "Add Member"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        )}

        <div className="data-table-container">
          <div className="table-header">
            <h3>Members List ({filteredMembers.length})</h3>
            {searchTerm && (
              <span className="search-info">
                Showing results for: <strong>"{searchTerm}"</strong>
              </span>
            )}
          </div>

          <div className="data-table">
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="empty-state">
                <p>No members found{searchTerm ? ' matching your search' : ''}</p>
                {searchTerm && (
                  <button
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Flat Number</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Units Used</th>
                    <th>Pending Amount</th>
                    {/* <th>Actions</th>  */}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr
                      key={member.memberId}
                      className={`clickable-row ${selectedMember?.memberId === member.memberId ? 'selected' : ''}`}
                      onClick={() => setSelectedMember(member)} // Add onClick here
                    >
                      <td>
                        <div className="flat-cell">
                          <FaHome className="flat-icon" />
                          {member.flatNumber}
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${member.type.toLowerCase()}`}>
                          {member.type}
                        </span>
                      </td>
                      <td className="name-cell">{member.name}</td>
                      <td className="units-cell">{member.unitsUsed || 0}</td>
                      <td className="amount-cell">₹{member.pendingAmount || 0}</td>
                      {/* Remove this entire td element: */}
                      {/* <td className="actions-cell">
        <button
          className="view-btn"
          onClick={() => setSelectedMember(member)}
          title="View Details"
        >
          View
        </button>
      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selectedMember && <MemberModal member={selectedMember} />}
        {showBulkImport && <BulkImportModal />}
      </div>
    </Navbar>
  );
};

export default Members;