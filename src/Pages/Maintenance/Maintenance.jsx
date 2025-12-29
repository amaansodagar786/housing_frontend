import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPlus,
    FaSearch,
    FaEye,
    FaFilePdf,
    FaRupeeSign,
    FaTachometerAlt,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaHome,
    FaUser,
    FaWater,
    FaCog,
    FaExclamationTriangle,
    FaCheckCircle
} from "react-icons/fa";
import Navbar from "../../Components/Sidebar/Navbar";
import "./Maintenance.scss";
import "react-toastify/dist/ReactToastify.css";

const Maintenance = () => {
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [members, setMembers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rates, setRates] = useState({
        waterRate: 0,
        ownerRate: 0,
        rentRate: 0,
    });

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        fetchMaintenanceRecords();
        fetchMembers();
        fetchRates();
    }, []);

    const fetchMaintenanceRecords = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/maintenance/get-all`);
            const data = await res.json();
            setMaintenanceRecords(data);
        } catch {
            toast.error("Failed to fetch maintenance records");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/member/get-members`);
            const data = await res.json();
            setMembers(data);
        } catch {
            toast.error("Failed to fetch members");
        }
    };

    const fetchRates = async () => {
        try {
            const [waterRes, maintenanceRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/water-rate/get`),
                fetch(`${import.meta.env.VITE_API_URL}/maintenance-rate/get`)
            ]);

            const waterData = waterRes.ok ? await waterRes.json() : { unitRate: 0 };
            const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : { ownerRate: 0, rentRate: 0 };

            setRates({
                waterRate: waterData.unitRate || 0,
                ownerRate: maintenanceData.ownerRate || 0,
                rentRate: maintenanceData.rentRate || 0,
            });
        } catch {
            toast.error("Failed to fetch rates");
        }
    };

    /* ================= FORM INITIAL VALUES ================= */
    const initialValues = {
        memberId: "",
        newReadingUnits: "",
        fineAmount: 0,
        fineReason: "",
        collectionAmount: "",
        collectionDate: new Date().toISOString().split("T")[0]
    };

    const validationSchema = Yup.object({
        memberId: Yup.string().required("Please select a flat"),
        newReadingUnits: Yup.number()
            .required("New reading is required")
            .min(0, "Must be positive")
            .typeError("Must be a number"),
        fineAmount: Yup.number().min(0, "Cannot be negative").optional(),
        collectionAmount: Yup.number()
            .required("Collection amount is required")
            .min(0, "Cannot be negative")
            .typeError("Must be a number"),
        collectionDate: Yup.date().required("Collection date is required"),
    });

    // In your handleSubmit function, update this part:
    const handleSubmit = async (values, { resetForm, setFieldError }) => {
        try {
            setIsSubmitting(true);

            console.log("📤 Sending to backend:", values);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/maintenance/create-maintenance`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                }
            );

            const responseData = await res.json();
            console.log("📥 Backend response:", responseData);

            if (!res.ok) {
                if (responseData.field) setFieldError(responseData.field, responseData.message);
                throw new Error(responseData.message || "Failed to create maintenance");
            }

            // ✅ THIS IS THE FIX: responseData.data contains the maintenance record
            if (responseData.success && responseData.data) {
                setMaintenanceRecords(prev => [responseData.data, ...prev]);
                toast.success(responseData.message || "Maintenance created successfully");
                resetForm();
                setShowForm(false);
                setSelectedMember(null);
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (err) {
            console.error("❌ Submission error:", err);
            toast.error(err.message || "Failed to create maintenance");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ================= MEMBER SELECTION ================= */
    const [selectedMember, setSelectedMember] = useState(null);
    const memberOptions = members.map((m) => ({
        value: m.memberId,
        label: `${m.flatNumber} - ${m.name} (${m.type})`,
        data: m
    }));

    /* ================= CALCULATIONS ================= */
    const calculateTotals = (values, member) => {
        if (!member) return null;

        const previousUnit = member.unitsUsed || 0;
        const totalUnits = values.newReadingUnits && values.newReadingUnits >= previousUnit
            ? values.newReadingUnits - previousUnit
            : 0;

        const waterAmount = totalUnits * rates.waterRate;
        const fixedMaintenance = member.type === "OWNER" ? rates.ownerRate : rates.rentRate;
        const previousPending = member.pendingAmount || 0;

        const totalMaintenance = waterAmount + fixedMaintenance + previousPending + Number(values.fineAmount || 0);
        const pendingAmount = totalMaintenance - (Number(values.collectionAmount) || 0);
        const finalPending = pendingAmount > 0 ? pendingAmount : 0;

        return {
            previousUnit,
            totalUnits,
            waterAmount,
            fixedMaintenance,
            previousPending,
            totalMaintenance,
            finalPending
        };
    };

    /* ================= RECORD DETAILS MODAL ================= */
    const RecordModal = ({ record }) => (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <FaEye /> Maintenance Details
                    </h3>
                    <button className="close-btn" onClick={() => setSelectedRecord(null)}>×</button>
                </div>

                <div className="modal-body">
                    <div className="detail-grid">
                        <div className="detail-row">
                            <div className="detail-label">Maintenance No</div>
                            <div className="detail-value badge">{record.maintenanceNo}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Flat Number</div>
                            <div className="detail-value">{record.flatNo}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Member Name</div>
                            <div className="detail-value">{record.memberName}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Member Type</div>
                            <div className="detail-value badge">{record.memberType}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Collection Date</div>
                            <div className="detail-value">
                                {new Date(record.collectionDate).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="section-divider">Water Usage</div>

                        <div className="detail-row">
                            <div className="detail-label">Previous Units</div>
                            <div className="detail-value">{record.previousUnitUsed}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">New Units</div>
                            <div className="detail-value">{record.newReadingUnits}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Total Units</div>
                            <div className="detail-value badge">{record.totalUnits}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Water Rate</div>
                            <div className="detail-value">₹{record.waterUnitRate}/unit</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Water Amount</div>
                            <div className="detail-value amount">₹{record.waterMaintenanceAmount}</div>
                        </div>

                        <div className="section-divider">Maintenance Charges</div>

                        <div className="detail-row">
                            <div className="detail-label">Fixed Rate</div>
                            <div className="detail-value">₹{record.fixedMaintenanceRate}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Fixed Amount</div>
                            <div className="detail-value amount">₹{record.fixedMaintenanceAmount}</div>
                        </div>

                        {record.fineAmount > 0 && (
                            <>
                                <div className="section-divider">Fine Details</div>
                                <div className="detail-row">
                                    <div className="detail-label">Fine Amount</div>
                                    <div className="detail-value amount error">₹{record.fineAmount}</div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-label">Fine Reason</div>
                                    <div className="detail-value">{record.fineReason || "Not specified"}</div>
                                </div>
                            </>
                        )}

                        <div className="section-divider">Payment Summary</div>

                        <div className="detail-row">
                            <div className="detail-label">Previous Pending</div>
                            <div className="detail-value amount">₹{record.previousPendingAmount}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Total Maintenance</div>
                            <div className="detail-value amount total">₹{record.totalMaintenanceAmount}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">Collection Amount</div>
                            <div className="detail-value amount success">₹{record.collectionAmount}</div>
                        </div>

                        <div className="detail-row">
                            <div className="detail-label">New Pending</div>
                            <div className="detail-value amount pending">₹{record.pendingAmount}</div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="pdf-btn" onClick={() => toast.info("PDF export coming soon")}>
                        <FaFilePdf /> Export PDF
                    </button>
                </div>
            </div>
        </div>
    );

    /* ================= FILTERED RECORDS ================= */
    const filteredRecords = maintenanceRecords.filter(record =>
        record.flatNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.maintenanceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Navbar>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="maintenance-container">

                {/* PAGE HEADER */}
                <div className="page-header">
                    <h2>
                        <FaCog /> Maintenance Management
                    </h2>
                    <div className="header-controls">
                        <div className="search-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by flat, name or maintenance no..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="action-buttons-group">
                            <button
                                className="add-btn"
                                onClick={() => setShowForm(!showForm)}
                            >
                                <FaPlus /> {showForm ? "Close Form" : "New Maintenance"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAINTENANCE FORM */}
                {showForm && (
                    <div className="form-container premium">
                        <h2>
                            <FaMoneyBillWave /> New Maintenance Entry
                        </h2>

                        <Formik
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            validate={(values) => {
                                const errors = {};
                                const member = selectedMember?.data;

                                if (member && values.newReadingUnits) {
                                    const previousUnit = member.unitsUsed || 0;
                                    if (values.newReadingUnits < previousUnit) {
                                        errors.newReadingUnits = `New reading (${values.newReadingUnits}) cannot be less than previous reading (${previousUnit})`;
                                    }
                                }

                                return errors;
                            }}
                            onSubmit={handleSubmit}
                        >
                            {({ values, setFieldValue, setFieldTouched }) => {
                                const member = selectedMember?.data;
                                const totals = calculateTotals(values, member);

                                return (
                                    <Form>
                                        {/* COLLECTION DATE */}
                                        <div className="form-row">
                                            <div className="form-field">
                                                <label htmlFor="collectionDate">
                                                    <FaCalendarAlt /> Collection Date *
                                                </label>
                                                <Field
                                                    type="date"
                                                    name="collectionDate"
                                                    id="collectionDate"
                                                />
                                                <ErrorMessage name="collectionDate" component="div" className="error" />
                                            </div>
                                        </div>

                                        {/* FLAT SELECTION */}
                                        <div className="form-row">
                                            <div className="form-field">
                                                <label htmlFor="memberId">
                                                    <FaHome /> Select Flat *
                                                </label>
                                                <Select
                                                    options={memberOptions}
                                                    value={memberOptions.find(opt => opt.value === values.memberId)}
                                                    onChange={(option) => {
                                                        setFieldValue("memberId", option?.value || "");
                                                        setSelectedMember(option);
                                                    }}
                                                    onBlur={() => setFieldTouched("memberId", true)}
                                                    placeholder="Search for flat number..."
                                                    isClearable
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                />
                                                <ErrorMessage name="memberId" component="div" className="error" />
                                            </div>
                                        </div>

                                        {/* MEMBER INFO */}
                                        {member && totals && (
                                            <>
                                                <div className="info-card">
                                                    <h4>
                                                        <FaUser /> Member Information
                                                    </h4>
                                                    <div className="info-grid">
                                                        <div className="info-item">
                                                            <span className="info-label">Name:</span>
                                                            <span className="info-value">{member.name}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="info-label">Type:</span>
                                                            <span className={`info-value badge ${member.type.toLowerCase()}`}>
                                                                {member.type}
                                                            </span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="info-label">Previous Units:</span>
                                                            <span className="info-value">{totals.previousUnit}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <span className="info-label">Previous Pending:</span>
                                                            <span className="info-value amount">₹{member.pendingAmount || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* NEW READING */}
                                                <div className="form-row">
                                                    <div className="form-field">
                                                        <label htmlFor="newReadingUnits">
                                                            <FaTachometerAlt /> New Reading Units *
                                                        </label>
                                                        <Field
                                                            type="number"
                                                            name="newReadingUnits"
                                                            id="newReadingUnits"
                                                            placeholder={`Enter new reading (min: ${totals.previousUnit})`}
                                                            min={totals.previousUnit}
                                                        />
                                                        <ErrorMessage name="newReadingUnits" component="div" className="error" />
                                                    </div>
                                                </div>

                                                {/* CALCULATION PREVIEW */}
                                                {values.newReadingUnits && (
                                                    <div className="calculation-card">
                                                        <h4>
                                                            <FaWater /> Water Usage Calculation
                                                        </h4>
                                                        <div className="calc-grid">
                                                            <div className="calc-item">
                                                                <span className="calc-label">Previous Units:</span>
                                                                <span className="calc-value">{totals.previousUnit}</span>
                                                            </div>
                                                            <div className="calc-item">
                                                                <span className="calc-label">New Units:</span>
                                                                <span className="calc-value">{values.newReadingUnits}</span>
                                                            </div>
                                                            <div className="calc-item">
                                                                <span className="calc-label">Total Units:</span>
                                                                <span className="calc-value badge">{totals.totalUnits}</span>
                                                            </div>
                                                            <div className="calc-item">
                                                                <span className="calc-label">Water Rate:</span>
                                                                <span className="calc-value">₹{rates.waterRate}/unit</span>
                                                            </div>
                                                            <div className="calc-item total">
                                                                <span className="calc-label">Water Amount:</span>
                                                                <span className="calc-value amount">₹{totals.waterAmount}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* FINE SECTION */}
                                                <div className="form-row">
                                                    <div className="form-field">
                                                        <label htmlFor="fineAmount">
                                                            <FaExclamationTriangle /> Fine Amount (Optional)
                                                        </label>
                                                        <Field
                                                            type="number"
                                                            name="fineAmount"
                                                            id="fineAmount"
                                                            placeholder="Enter fine amount"
                                                            min="0"
                                                        />
                                                        <ErrorMessage name="fineAmount" component="div" className="error" />
                                                    </div>

                                                    <div className="form-field">
                                                        <label htmlFor="fineReason">Fine Reason</label>
                                                        <Field
                                                            type="text"
                                                            name="fineReason"
                                                            id="fineReason"
                                                            placeholder="Reason for fine"
                                                        />
                                                        <ErrorMessage name="fineReason" component="div" className="error" />
                                                    </div>
                                                </div>

                                                {/* TOTAL SUMMARY */}
                                                {(values.newReadingUnits || values.fineAmount) && (
                                                    <div className="summary-card">
                                                        <h4>
                                                            <FaMoneyBillWave /> Maintenance Summary
                                                        </h4>
                                                        <div className="summary-grid">
                                                            <div className="summary-item">
                                                                <span className="summary-label">Water Amount:</span>
                                                                <span className="summary-value">₹{totals.waterAmount}</span>
                                                            </div>
                                                            <div className="summary-item">
                                                                <span className="summary-label">Fixed Maintenance:</span>
                                                                <span className="summary-value">₹{totals.fixedMaintenance}</span>
                                                            </div>
                                                            <div className="summary-item">
                                                                <span className="summary-label">Previous Pending:</span>
                                                                <span className="summary-value">₹{member.pendingAmount || 0}</span>
                                                            </div>
                                                            {values.fineAmount > 0 && (
                                                                <div className="summary-item">
                                                                    <span className="summary-label">Fine Amount:</span>
                                                                    <span className="summary-value error">₹{values.fineAmount}</span>
                                                                </div>
                                                            )}
                                                            <div className="summary-item total">
                                                                <span className="summary-label">Total Maintenance:</span>
                                                                <span className="summary-value total">₹{totals.totalMaintenance}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* COLLECTION AMOUNT */}
                                                <div className="form-row">
                                                    <div className="form-field">
                                                        <label htmlFor="collectionAmount">
                                                            <FaRupeeSign /> Collection Amount *
                                                        </label>
                                                        <Field
                                                            type="number"
                                                            name="collectionAmount"
                                                            id="collectionAmount"
                                                            placeholder="Enter amount collected"
                                                            min="0"
                                                        />
                                                        <ErrorMessage name="collectionAmount" component="div" className="error" />
                                                    </div>
                                                </div>

                                                {/* FINAL PENDING */}
                                                {values.collectionAmount && (
                                                    <div className="pending-card">
                                                        <div className="pending-item">
                                                            <span className="pending-label">Total Due:</span>
                                                            <span className="pending-value">₹{totals.totalMaintenance}</span>
                                                        </div>
                                                        <div className="pending-item">
                                                            <span className="pending-label">Amount Collected:</span>
                                                            <span className="pending-value success">₹{values.collectionAmount}</span>
                                                        </div>
                                                        <div className="pending-item total">
                                                            <span className="pending-label">New Pending Amount:</span>
                                                            <span className="pending-value pending">₹{totals.finalPending}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* SUBMIT BUTTON */}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !member || !values.newReadingUnits || !values.collectionAmount}
                                            className="submit-btn"
                                        >
                                            {isSubmitting ? (
                                                <>Creating Maintenance...</>
                                            ) : (
                                                <>
                                                    <FaCheckCircle /> Create Maintenance
                                                </>
                                            )}
                                        </button>
                                    </Form>
                                );
                            }}
                        </Formik>
                    </div>
                )}

                {/* MAINTENANCE RECORDS TABLE */}
                <div className="data-table-container">
                    <div className="table-header">
                        <h3>
                            Maintenance Records ({filteredRecords.length})
                        </h3>
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
                                <p>Loading maintenance records...</p>
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="empty-state">
                                <p>No maintenance records found{searchTerm ? ' matching your search' : ''}</p>
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
                                        <th>Maintenance No</th>
                                        <th>Flat No</th>
                                        <th>Member Name</th>
                                        <th>Date</th>
                                        <th>Total Amount</th>
                                        <th>Collected</th>
                                        <th>Pending</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(record => (
                                        <tr key={record.maintenanceId} className={selectedRecord?.maintenanceId === record.maintenanceId ? 'selected' : ''}>
                                            <td>
                                                <div className="maintenance-no">
                                                    <FaCog className="icon" />
                                                    {record.maintenanceNo}
                                                </div>
                                            </td>
                                            <td className="flat-cell">{record.flatNo}</td>
                                            <td className="name-cell">{record.memberName}</td>
                                            <td className="date-cell">
                                                {new Date(record.collectionDate).toLocaleDateString()}
                                            </td>
                                            <td className="amount-cell total">₹{record.totalMaintenanceAmount}</td>
                                            <td className="amount-cell success">₹{record.collectionAmount}</td>
                                            <td className="amount-cell pending">₹{record.pendingAmount}</td>
                                            <td className="actions-cell">
                                                <button
                                                    className="view-btn"
                                                    onClick={() => setSelectedRecord(record)}
                                                    title="View Details"
                                                >
                                                    <FaEye /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* MODAL FOR RECORD DETAILS */}
                {selectedRecord && <RecordModal record={selectedRecord} />}
            </div>
        </Navbar>
    );
};

export default Maintenance;