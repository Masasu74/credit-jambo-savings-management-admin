import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import DataView from "../components/DataView";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import ConfirmationPopup from "../components/ConfirmationPopup";
import Loader from "../components/Loader";
import { useSystemColors } from "../hooks/useSystemColors";

const CustomerList = () => {
  const navigate = useNavigate();
  const { colors } = useSystemColors();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fallback colors
  const fallbackColors = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  const {
    customers = [],
    fetchCustomers,
    deleteCustomer,
    customersLoading,
    error,
    user
  } = useAppContext();

  useEffect(() => {
    const loadData = async () => {
      // Force refresh to ensure we get the latest data
      await fetchCustomers(true);
    };
    loadData();
  }, [fetchCustomers]);

  // Refresh data when user returns to this page (focus event)
  useEffect(() => {
    const handleFocus = () => {
      if (import.meta.env.MODE === 'development') {
        console.log('🔄 CustomerList: Page focused, refreshing data');
      }
      fetchCustomers(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchCustomers]);

  const handleOpenPopup = (message, customerId) => {
    setPopupMessage(message);
    setSelectedCustomer(customerId);
    setShowPopup(true);
  };

  const handleConfirm = async () => {
    if (selectedCustomer) {
      try {
        await deleteCustomer(selectedCustomer);
        // Force refresh after deletion to ensure we get the latest data
        await fetchCustomers(true);
      } catch (error) {
        console.error("Customer deletion failed:", error);
        // Error is already handled by handlePermissionError in AppContext
      }
    }
    setShowPopup(false);
  };

  const columns = [
    {
      key: "customerCode",
      header: "Customer Code",
      render: (item) => item.customerCode || "N/A"
    },
    {
      key: "fullName",
      header: "Full Name",
      render: (item) => item.fullName || "N/A"
    },
    {
      key: "email",
      header: "Email",
      render: (item) => item.email || "N/A"
    },
    {
      key: "deviceVerified",
      header: "Device Verified",
      render: (item) => {
        const verified = item.deviceVerified;
        let backgroundColor, color;
        
        if (verified === true) {
          backgroundColor = `${currentColors.success}20`;
          color = currentColors.success;
        } else {
          backgroundColor = `${currentColors.error}20`;
          color = currentColors.error;
        }
        
        return (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap"
            style={{
              backgroundColor,
              color,
              borderColor: color
            }}
          >
            {verified ? "Verified" : "Pending"}
          </span>
        );
      }
    },
    {
      key: "isActive",
      header: "Status",
      render: (item) => {
        const active = item.isActive;
        let backgroundColor, color;
        
        if (active === true) {
          backgroundColor = `${currentColors.success}20`;
          color = currentColors.success;
        } else {
          backgroundColor = `${currentColors.error}20`;
          color = currentColors.error;
        }
        
        return (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap"
            style={{
              backgroundColor,
              color,
              borderColor: color
            }}
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      }
    },
    {
      key: "createdBy.fullName",
      header: "Added By",
      render: (item) => item.createdBy?.fullName || "N/A"
    },
    {
      key: "createdAt",
      header: "Registered",
      render: (item) =>
        new Date(item.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    }
  ];

  const filters = [
    {
      key: "isActive",
      placeholder: "Status",
      options: [
        { value: "", label: "All" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" }
      ]
    },
    {
      key: "deviceVerified",
      placeholder: "Device Verification",
      options: [
        { value: "", label: "All" },
        { value: "true", label: "Verified" },
        { value: "false", label: "Pending" }
      ]
    }
  ];

  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <>
      <DataView
        title="Customers"
        description="View and manage registered customers"
        columns={columns}
        data={customers}
        loading={customersLoading}
        filters={filters}
        onAddNew={() => navigate("/addcustomer")}
        renderActions={(item) => (
          <div className="flex gap-3 items-center">
            <FaEye
              size={18}
              className="text-blue-600 cursor-pointer hover:text-blue-800"
              title="View"
              onClick={() => navigate(`/customers/${item._id}`)}
            />
            <FaEdit
              size={18}
              className="text-gray-600 cursor-pointer hover:text-gray-800"
              title="Edit"
              onClick={() => navigate(`/customers/edit/${item._id}`)}
            />
            {user?.role === "admin" && (
              <FaTrash
                size={18}
                className="text-red-600 cursor-pointer hover:text-red-800"
                title="Delete"
                onClick={() =>
                  handleOpenPopup("Are you sure you want to delete this customer?", item._id)
                }
              />
            )}
          </div>
        )}
        pagination={{
          pageSize: 10,
          currentPage: 1,
        }}
        searchPlaceholder="Search by customer code, name, or email"
      />

      <ConfirmationPopup
        isOpen={showPopup}
        message={popupMessage}
        onConfirm={handleConfirm}
        onCancel={() => setShowPopup(false)}
      />
    </>
  );
};

export default CustomerList;
