import { useEffect, useRef, useState } from "react";
import React from "react";

// ── module-level design tokens (available in ErrorBoundary + App) ──
const CC_BTN_CSS = [
  ".cc-btn:hover:not(:disabled){opacity:.83}",
  ".cc-btn:focus-visible{outline:2px solid #3b82f6;outline-offset:2px}",
  ".cc-btn:disabled{opacity:.4;cursor:not-allowed}",
  ".cc-btn.loading{opacity:.65;cursor:wait}",
  ".cc-tab:hover{background:rgba(255,255,255,.7)!important}",
  ".cc-tab:focus-visible{outline:2px solid #3b82f6;outline-offset:1px}",
  ".cc-tab:disabled{opacity:.4;cursor:not-allowed}",
  ".cc-menu-item:hover{background:#f8fafc!important}",
  ".cc-menu-item.danger:hover{background:#fff1f1!important}",
  ".cc-product-tile:hover{border-color:#2563eb!important}",
  ".cc-nav-tab:hover{background:rgba(255,255,255,.18)!important}",
  ".cc-nav-tab:focus-visible{outline:2px solid rgba(255,255,255,.6);outline-offset:2px}",
  ".cc-underline-tab:hover:not(:disabled){color:#374151!important}",
  ".cc-underline-tab:focus-visible{outline:2px solid #3b82f6;outline-offset:2px}",
  "@media(max-width:767px){.home-table-wrap{display:none!important}.home-cards{display:flex!important;flex-direction:column;gap:12px}}",
  "@media(min-width:768px){.home-cards{display:none!important}}",
  "@media(max-width:767px){.sales-tbl{display:none!important}.sales-mob{display:flex!important;flex-direction:column;gap:8px}}",
  "@media(min-width:768px){.sales-mob{display:none!important}}",
  ".sales-content-wrap{height:calc(100vh - 54px);height:calc(100dvh - 54px);overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column}",
  "@media(max-width:767px){.sales-content-wrap{height:auto!important;min-height:calc(100svh - 54px);overflow:visible!important;flex:none!important}}",
  "@media(max-width:767px){.inv-content-wrap{height:auto!important;overflow:visible!important}}",
].join("");

type BtnVariant = "primary" | "success" | "danger" | "secondary" | "ghost" | "warning" | "dangerGhost" | "teal" | "purple";
const mkBtn = (variant: BtnVariant, size: "sm" | "md" | "lg" = "md"): React.CSSProperties => ({
  background:
    variant === "primary"     ? "#2563eb" : variant === "success"      ? "#16a34a" :
    variant === "danger"      ? "#dc2626" : variant === "warning"      ? "#d97706" :
    variant === "teal"        ? "#0f766e" : variant === "purple"       ? "#7c3aed" :
    (variant === "ghost" || variant === "dangerGhost") ? "transparent" : "#f1f5f9",
  color: variant === "secondary" ? "#374151" : variant === "ghost" ? "#374151" :
         variant === "dangerGhost" ? "#dc2626" : "white",
  border: variant === "ghost" ? "1px solid #e2e8f0" : variant === "dangerGhost" ? "2px solid #dc2626" : "none",
  borderRadius: "10px",
  padding: size === "sm" ? "5px 12px" : size === "lg" ? "13px 24px" : "8px 18px",
  fontSize: size === "sm" ? "12px" : size === "lg" ? "15px" : "14px",
  fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "opacity 0.15s",
});

const formatCurrency = (n: number) => `₪${Math.round(n).toLocaleString("he-IL")}`;
const formatDateIL = (d: string) => {
  if (!d) return "—";
  const p = d.split("-");
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d;
};
const formatTransactionCount = (n: number) => n === 1 ? "עסקה אחת" : `${n} עסקאות`;

class ErrorBoundary extends React.Component<any, { error: any }>{
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <style>{CC_BTN_CSS}</style>
          <h2>אירעה שגיאה בתצוגה</h2>
          <div style={{ whiteSpace: "pre-wrap", color: "#b91c1c" }}>
            {String(this.state.error)}
          </div>
          <button onClick={() => window.location.reload()}
            className="cc-btn" style={{ ...mkBtn("primary"), marginTop: 12 }}>
            רענן
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import * as XLSX from "xlsx";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  warehouseCode?: string;
  priceLevels?: number[];
  giftTrigger?: boolean;
  isGiftBag?: boolean;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

type CustomerType =
  | "1"
  | "2"
  | "3";

type Customer = {
  id: number;
  name: string;
  phone: string;
  idNumber: string;
  customerType: CustomerType;
};

type Role = "admin" | "seller";

type Transaction = {
  id: number;
  items: CartItem[];
  total: number;
  finalTotal: number;
  discountPercent: number;
  date: string;
  dateISO?: string;
  customerId?: number;
  seller: string;
  customerName: string;
  customerPhone: string;
  paymentMethod?: string;
  installments?: number;
  cashReceived?: number;
  savedCustomer?: Customer;
  cashChange?: number;
  isReturn?: boolean;
  returnForId?: number;
  preOrderId?: number;
  saleDayId?: number;
};

const defaultProducts: Product[] = [
  {
    id: 1,
    name: "לחם",
    price: 12,
    category: "מאפים",
    stock: 20,
  },
  {
    id: 2,
    name: "חלב",
    price: 7,
    category: "מוצרי חלב",
    stock: 15,
  },
  {
    id: 3,
    name: "שוקולד",
    price: 5,
    category: "ממתקים",
    stock: 8,
  },
];

type PreOrder = {
  id: number;
  customerName: string;
  customerPhone: string;
  notes: string;
  items: CartItem[];
  status: "pending" | "paid";
};

type SaleDayType = "preorder" | "walkin" | "walkin-nodiscount" | "open";

type InventoryItem = {
  productId: number;
  productName: string;
  requiredQty: number;
  plannedQty?: number;
  actualInQty: number;
  lastYearQty?: number;
  actualEndQty?: number;
  warehouseCode?: string;
};

type WarehouseItem = {
  id: number;
  year: number;
  code: string;
  name: string;
  openingQty: number;
  addedQty: number;
  adjustmentQty: number;
  notes?: string;
  supplier?: string;
  costPrice?: number;
};

type SaleDay = {
  id: number;
  name: string;
  type: SaleDayType;
  isActive: boolean;
  date: string;
  discountPercent: number;
  preOrders: PreOrder[];
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  inventory?: InventoryItem[];
  priceLevels?: number[];
};

export default function App() {
  const [products, setProducts] =
    useState<Product[]>(() => {
      const saved =
        localStorage.getItem(
          "products"
        );

      return saved
        ? JSON.parse(saved)
        : defaultProducts;
    });

  const [customers, setCustomers] =
    useState<Customer[]>(() => {
      const saved =
        localStorage.getItem(
          "customers"
        );

      return saved
        ? JSON.parse(saved)
        : [];
    });

  const [transactions, setTransactions] =
    useState<Transaction[]>(() => {
      const saved =
        localStorage.getItem(
          "transactions"
        );

      return saved
        ? JSON.parse(saved)
        : [];
    });

  const [cart, setCart] = useState<
    CartItem[]
  >([]);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState("מאפים");

  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "check" | "credit">
    ("cash");

  const [cashReceived, setCashReceived] =
    useState("");

  const [checkInstallments, setCheckInstallments] =
    useState(1);

  const [creditInstallments, setCreditInstallments] =
    useState(1);

  const [showCreditModal, setShowCreditModal] =
    useState(false);

  const [creditPaymentProcessing, setCreditPaymentProcessing] =
    useState(false);

  const [creditPaymentError, setCreditPaymentError] =
    useState("");

  const [creditPaymentSuccess, setCreditPaymentSuccess] =
    useState(false);

  const [activePreOrderRef, setActivePreOrderRef] =
    useState<{ orderId: number; saleDayId: number } | null>(null);

  const [openPriceProduct, setOpenPriceProduct] = useState<Product | null>(null);
  const [openPriceManual, setOpenPriceManual] = useState("");
  const [manualDiscountAmount, setManualDiscountAmount] = useState("");



  const [historyCustomerId, setHistoryCustomerId] =
    useState<number | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<number | null>(null);

  const [selectedReportType, setSelectedReportType] =
    useState<"daily" | "monthly" | "category" | "customer" | "seller">(
      "daily"
    );

  const [sellers, setSellers] = useState<{ name: string; isAdmin: boolean }[]>(() => {
    const saved = localStorage.getItem("sellers");
    if (!saved) return [{ name: "מוכר ראשי", isAdmin: true }];
    const parsed = JSON.parse(saved);
    if (parsed.length > 0 && typeof parsed[0] === "string") {
      return (parsed as string[]).map(name => ({ name, isAdmin: false }));
    }
    return parsed;
  });

  const [currentSeller, setCurrentSeller] = useState("מוכר ראשי");
  const currentRole: Role = sellers.find(s => s.name === currentSeller)?.isAdmin ? "admin" : "seller";

  const [newSeller, setNewSeller] =
    useState("");

  const [newName, setNewName] =
    useState("");

  const [newPrice, setNewPrice] =
    useState("");

  const [newCategory, setNewCategory] =
    useState("");

  const [showNewProductForm, setShowNewProductForm] = useState(false);

  const [newCustomerName, setNewCustomerName] =
    useState("");

  const [newCustomerPhone, setNewCustomerPhone] =
    useState("");

  const [newCustomerIdNumber, setNewCustomerIdNumber] =
    useState("");

  const [newCustomerType, setNewCustomerType] =
    useState<CustomerType>("3");

  const [editingCustomerId, setEditingCustomerId] =
    useState<number | null>(null);

  const [editingCustomerName, setEditingCustomerName] =
    useState("");

  const [editingCustomerPhone, setEditingCustomerPhone] =
    useState("");

  const [editingCustomerIdNumber, setEditingCustomerIdNumber] =
    useState("");

  const [editingCustomerType, setEditingCustomerType] =
    useState<CustomerType>("3");

  const [pendingSales, setPendingSales] =
    useState<Transaction[]>(() => {
      const saved = localStorage.getItem("pendingSales");
      const sales: Transaction[] = saved ? JSON.parse(saved) : [];
      if (sales.some(s => !s.saleDayId)) {
        const daysRaw = localStorage.getItem("saleDays");
        if (daysRaw) {
          const days: SaleDay[] = JSON.parse(daysRaw);
          const activeDay = days.find(d => d.isActive);
          if (activeDay) {
            return sales.map(s => !s.saleDayId ? { ...s, saleDayId: activeDay.id } : s);
          }
        }
      }
      return sales;
    });

  const [saleDays, setSaleDays] = useState<SaleDay[]>(() => {
    const saved = localStorage.getItem("saleDays");
    if (!saved) return [];
    let days: SaleDay[] = JSON.parse(saved);
    let idCounter = Date.now() * 10000;
    days = days.map(day => {
      const seen = new Set<number>();
      return {
        ...day,
        customers: (day.customers ?? []).map(c => {
          if (seen.has(c.id)) return { ...c, id: idCounter++ };
          seen.add(c.id);
          return c;
        }),
      };
    });
    return days;
  });

  const [newSaleDayName, setNewSaleDayName] = useState("");
  const [newSaleDayType, setNewSaleDayType] = useState<SaleDayType>("walkin");
  const [newSaleDayDate, setNewSaleDayDate] = useState("");
  const [showNewSaleDayForm, setShowNewSaleDayForm] = useState(false);

  const [preOrderForm, setPreOrderForm] = useState<{
    saleDayId: number;
    orderId?: number;
    customerName: string;
    customerPhone: string;
    notes: string;
    items: CartItem[];
  } | null>(null);

  const [poProductId, setPoProductId] = useState(0);
  const [poQty, setPoQty] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersFilter, setOrdersFilter] = useState<"all" | "pending" | "paid">("all");
  const [showSaleActionsMenu, setShowSaleActionsMenu] = useState(false);
  const [showOrdersActionsMenu, setShowOrdersActionsMenu] = useState(false);
  const [showCustomersActionsMenu, setShowCustomersActionsMenu] = useState(false);
  const [txSearch, setTxSearch] = useState("");
  const [editingCustomerIdx, setEditingCustomerIdx] = useState<number | null>(null);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [closeDayActuals, setCloseDayActuals] = useState<Record<number, number>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSearch, setReturnSearch] = useState("");
  const [returnSourceId, setReturnSourceId] = useState<number | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [customersTabSearch, setCustomersTabSearch] = useState("");
  const [showCustomersModalDayId, setShowCustomersModalDayId] = useState<number | null>(null);
  const [showNewCustomerModalDayId, setShowNewCustomerModalDayId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  // ── ConfirmDialog, AlertDialog & Toast ──
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; itemName?: string;
    onConfirm: () => void; confirmLabel?: string; confirmVariant?: BtnVariant;
  } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ title: string; message: string } | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" | "info" | "warning" }>>([]);

  // ── Internal tab states ──
  const [reportTab, setReportTab] = useState<"sales" | "breakdown" | "inventory">("sales");
  const [breakdownTab, setBreakdownTab] = useState<"category" | "customer" | "seller">("category");
  const [settingsTab, setSettingsTab] = useState<"sellers" | "backup" | "maintenance" | "log">("sellers");

  // ── Home screen filters ──
  const [homeSearch, setHomeSearch] = useState("");
  const [homeTypeFilter, setHomeTypeFilter] = useState<"" | "walkin" | "walkin-nodiscount" | "preorder" | "open">("");

  // ── Settings extras ──
  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logSellerFilter, setLogSellerFilter] = useState("");

  const [editingProductId, setEditingProductId] =
    useState<number | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [editingPrice, setEditingPrice] =
    useState("");

  const [editingCategory, setEditingCategory] =
    useState("");

  const [editingPriceLevels, setEditingPriceLevels] =
    useState("");

  const [newPriceLevels, setNewPriceLevels] =
    useState("");

  const [newGiftTrigger, setNewGiftTrigger] = useState(false);
  const [newIsGiftBag, setNewIsGiftBag] = useState(false);
  const [editingGiftTrigger, setEditingGiftTrigger] = useState(false);
  const [editingIsGiftBag, setEditingIsGiftBag] = useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen toggle failed", error);
    }
  };

  useEffect(() => {
    const id = "cc-btn-style";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = CC_BTN_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "products",
      JSON.stringify(products)
    );
  }, [products]);

  useEffect(() => {
    localStorage.setItem(
      "customers",
      JSON.stringify(customers)
    );
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "sellers",
      JSON.stringify(sellers)
    );
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem(
      "pendingSales",
      JSON.stringify(pendingSales)
    );
  }, [pendingSales]);

  useEffect(() => {
    localStorage.setItem("saleDays", JSON.stringify(saleDays));
  }, [saleDays]);

  const [activityLog, setActivityLog] = useState<{ id: number; date: string; seller: string; action: string }[]>(() => {
    const saved = localStorage.getItem("activityLog");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("activityLog", JSON.stringify(activityLog));
  }, [activityLog]);

  const [inventorySelectedDayId, setInventorySelectedDayId] = useState<number | null>(null);
  const [inventorySelectedYear, setInventorySelectedYear] = useState<number>(new Date().getFullYear());
  const [inventoryStep, setInventoryStep] = useState<"select" | "planning" | "packing" | "live" | "closing">("select");
  const [annualOpen, setAnnualOpen] = useState(false);
  const lastYearFileRef = useRef<HTMLInputElement>(null);
  const saleDayImportRef = useRef<HTMLInputElement>(null);

  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>(() => {
    const saved = localStorage.getItem("warehouseItems");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem("warehouseItems", JSON.stringify(warehouseItems));
  }, [warehouseItems]);
  const [warehouseYear, setWarehouseYear] = useState<number>(new Date().getFullYear());
  const [warehouseDetailCode, setWarehouseDetailCode] = useState<string | null>(null);
  const [warehouseFormVisible, setWarehouseFormVisible] = useState(false);
  const [warehouseEditId, setWarehouseEditId] = useState<number | null>(null);
  const [whCode, setWhCode] = useState("");
  const [whName, setWhName] = useState("");
  const [whOpeningQty, setWhOpeningQty] = useState("");
  const [whAddedQty, setWhAddedQty] = useState("");
  const [whAdjQty, setWhAdjQty] = useState("");
  const [whNotes, setWhNotes] = useState("");
  const [whSupplier, setWhSupplier] = useState("");
  const [whCostPrice, setWhCostPrice] = useState("");
  const [warehouseView, setWarehouseView] = useState<"items" | "suppliers">("items");
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Set<string>>(new Set());
  const [planningSearch, setPlanningSearch] = useState("");
  const [planningFilter, setPlanningFilter] = useState<"all" | "unlinked" | "gap">("all");
  const [packingSearch, setPackingSearch] = useState("");
  const [packingFilter, setPackingFilter] = useState<"all" | "ok" | "missing" | "excess" | "pending">("all");
  const [liveSearch, setLiveSearch] = useState("");
  const [closingSearch, setClosingSearch] = useState("");
  const [closingFilter, setClosingFilter] = useState<"all" | "uncounted" | "variance">("all");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [warehouseSupplierFilter, setWarehouseSupplierFilter] = useState("");

  // ── מצב ניווט חדש ──
  const [cashierMode, setCashierMode] = useState(false);
  const [adminTab, setAdminTab] = useState<"home" | "sales" | "inventory" | "reports" | "settings">("home");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState("");
  const [saleDayDetailId, setSaleDayDetailId] = useState<number | null>(null);
  const [saleDayDetailTab, setSaleDayDetailTab] = useState<"info" | "products" | "customers" | "transactions" | "summary">("info");
  const [productsSearch, setProductsSearch] = useState("");
  const [productsCategoryFilter, setProductsCategoryFilter] = useState("");
  const [customersPage, setCustomersPage] = useState(0);
  const [ordersPage, setOrdersPage] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [showTxActionsMenu, setShowTxActionsMenu] = useState(false);
  const [inventoryAdminTab, setInventoryAdminTab] = useState<"inventory" | "warehouse">("inventory");
  const [reportsDayId, setReportsDayId] = useState<number | "all">("all");
  const [orphanPendingDayIds, setOrphanPendingDayIds] = useState<Record<number, number>>({});

  const activeSaleDay = saleDays.find(d => d.isActive) ?? null;

  const activeProducts = activeSaleDay ? (activeSaleDay.products ?? products) : products;
  const activeCustomers = activeSaleDay ? (activeSaleDay.customers ?? []) : customers;
  const activeTransactions = activeSaleDay ? (activeSaleDay.transactions ?? []) : transactions;

  const setActiveProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
    if (activeSaleDay) {
      const dayId = activeSaleDay.id;
      setSaleDays(prev => prev.map(d => {
        if (d.id !== dayId) return d;
        const current = d.products ?? products;
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...d, products: next };
      }));
    } else {
      setProducts(updater as any);
    }
  };
  const setActiveTransactions = (updater: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    if (activeSaleDay) {
      const dayId = activeSaleDay.id;
      setSaleDays(prev => prev.map(d => {
        if (d.id !== dayId) return d;
        const current = d.transactions ?? [];
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...d, transactions: next };
      }));
    } else {
      setTransactions(updater as any);
    }
  };

  const categories = [
    ...new Set(
      activeProducts.map((p) => p.category)
    ),
  ];

  const filteredProducts = activeProducts.filter((product) => {
    if (product.category !== selectedCategory) return false;
    if (!productSearch.trim()) return true;
    return product.name.toLowerCase().includes(productSearch.trim().toLowerCase());
  });

  const rawSearch = customerSearch.trim();

  const isPreorderMode = activeSaleDay?.type === "preorder";
  const isOpenMode = activeSaleDay?.type === "open";
  const isNoDiscountMode = activeSaleDay?.type === "preorder" || activeSaleDay?.type === "walkin-nodiscount" || isOpenMode;

  const normalizePhone = (p: string) => String(p || "").replace(/\D/g, "").replace(/^0+/, "");
  const phoneMatch = (stored: string, query: string) => {
    const s = normalizePhone(stored);
    const q = normalizePhone(query);
    if (!q) return false;
    return q.length >= 8 ? s === q : s.startsWith(q);
  };
  const nameMatch = (fullName: string, query: string) => {
    const parts = String(fullName || "").toLowerCase().trim().split(/\s+/);
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return words.every(w => parts.some(p => p.startsWith(w)));
  };
  const customerResults =
    isPreorderMode || rawSearch === "" || rawSearch.length < 2
      ? []
      : activeCustomers.filter((customer) => {
          const isPhoneSearch = /^[0-9]+$/.test(rawSearch);
          if (isPhoneSearch) {
            return phoneMatch(customer.phone, rawSearch);
          }
          return nameMatch(customer.name, rawSearch);
        }).slice(0, 10);

  const preOrderSearchResults =
    !isPreorderMode || rawSearch === ""
      ? []
      : (activeSaleDay?.preOrders ?? []).filter((order) => {
          if (order.status === "paid") return false;
          if (/^[0-9]+$/.test(rawSearch)) {
            return phoneMatch(order.customerPhone, rawSearch);
          }
          return nameMatch(order.customerName, rawSearch);
        });

  const getDiscountPercent = () => {
    if (!selectedCustomer || isNoDiscountMode) {
      return 0;
    }

    if (selectedCustomer.customerType === "1") {
      return 25;
    }

    if (selectedCustomer.customerType === "2") {
      return 15;
    }

    return 0;
  };

  const discountPercent =
    getDiscountPercent();

  const addToCart = (product: Product) => {
    if (isOpenMode) {
      if (product.price > 0) {
        const fixedPrice = product.price;
        const currentQty = cart.filter(i => i.id === product.id && i.price === fixedPrice).reduce((s, i) => s + i.qty, 0);
        const err = checkCanAddToCart(product.id, currentQty);
        if (err) { addToast(err, "error"); return; }
        setCart(prev => {
          const existing = prev.find(i => i.id === product.id && i.price === fixedPrice);
          if (existing) return prev.map(i => (i.id === product.id && i.price === fixedPrice) ? { ...i, qty: i.qty + 1 } : i);
          return [...prev, { id: product.id, name: product.name, price: fixedPrice, qty: 1 }];
        });
      } else {
        setOpenPriceProduct(product);
        setOpenPriceManual("");
      }
      return;
    }
    const currentQty = cart.find(i => i.id === product.id)?.qty ?? 0;
    const err = checkCanAddToCart(product.id, currentQty);
    if (err) { addToast(err, "error"); return; }
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { id: product.id, name: product.name, price: getEffectivePrice(product.price), qty: 1 }];
    });
  };

  const addToCartWithPrice = (product: Product, price: number) => {
    if (!price || price <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id && i.price === price);
      if (existing) return prev.map(i => (i.id === product.id && i.price === price) ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price, qty: 1 }];
    });
    setOpenPriceProduct(null);
    setOpenPriceManual("");
  };

  const increaseQty = (id: number, price?: number) => {
    const currentQty = cart.filter(i => i.id === id && (price === undefined || i.price === price)).reduce((s, i) => s + i.qty, 0);
    const err = checkCanAddToCart(id, currentQty);
    if (err) { addToast(err, "error"); return; }
    setCart(prev => prev.map(item =>
      item.id === id && (price === undefined || item.price === price)
        ? { ...item, qty: item.qty + 1 }
        : item
    ));
  };

  const decreaseQty = (id: number, price?: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && (price === undefined || item.price === price)
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const getGiftBagInfo = (items: CartItem[]) => {
    const products = activeSaleDay?.products ?? activeProducts;
    const bagProduct = products.find(p => p.isGiftBag) ?? null;
    if (!bagProduct) return { freeQty: 0, bagProduct: null, bagInCart: 0, freeBagsInCart: 0, giftDiscount: 0 };
    const freeQty = items
      .filter(i => products.find(p => p.id === i.id)?.giftTrigger)
      .reduce((s, i) => s + i.qty, 0);
    const bagInCart = items.filter(i => i.id === bagProduct.id).reduce((s, i) => s + i.qty, 0);
    const freeBagsInCart = Math.min(bagInCart, freeQty);
    const giftDiscount = freeBagsInCart * bagProduct.price;
    return { freeQty, bagProduct, bagInCart, freeBagsInCart, giftDiscount };
  };

  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;
  });

  const { freeQty: giftFreeQty, bagProduct: giftBagProduct, giftDiscount: giftBagDiscount } = getGiftBagInfo(cart);

  // Sync gift bag qty in cart to match trigger product qty (add or remove as needed)
  useEffect(() => {
    const products = activeSaleDay?.products ?? activeProducts;
    const bagProduct = products.find(p => p.isGiftBag);
    if (!bagProduct) return;
    setCart(prev => {
      const triggerQty = prev
        .filter(i => products.find(p => p.id === i.id)?.giftTrigger)
        .reduce((s, i) => s + i.qty, 0);
      const bagQty = prev.filter(i => i.id === bagProduct.id).reduce((s, i) => s + i.qty, 0);
      if (bagQty === triggerQty) return prev;
      if (bagQty < triggerQty) {
        const toAdd = triggerQty - bagQty;
        const existing = prev.find(i => i.id === bagProduct.id);
        if (existing) return prev.map(i => i.id === bagProduct.id ? { ...i, qty: i.qty + toAdd } : i);
        return [...prev, { id: bagProduct.id, name: bagProduct.name, price: bagProduct.price, qty: toAdd }];
      }
      // bagQty > triggerQty: reduce to match
      if (triggerQty === 0) return prev.filter(i => i.id !== bagProduct.id);
      return prev.map(i => i.id === bagProduct.id ? { ...i, qty: triggerQty } : i);
    });
  }, [giftFreeQty]); // eslint-disable-line react-hooks/exhaustive-deps

  const discountAmount = isOpenMode
    ? Math.min(Number(manualDiscountAmount) || 0, total - giftBagDiscount)
    : (total * discountPercent) / 100;

  const finalTotal = total - discountAmount - giftBagDiscount;

  const effectiveFinalTotal =
    paymentMethod === "cash"
      ? Math.round(finalTotal * 10) / 10
      : finalTotal;

  const roundingDiff =
    effectiveFinalTotal - finalTotal;

  const completeSale = () => {
    if (cart.length === 0) {
      return;
    }

    if (paymentMethod === "cash") {
      if (!cashReceived || cashReceived.trim() === "") {
        setPaymentModalError("יש להזין את הסכום שהתקבל");
        return;
      }
      const received = Number(cashReceived);
      if (received < effectiveFinalTotal) {
        setPaymentModalError(`הסכום שהתקבל (₪${received.toFixed(2)}) נמוך מהסכום לתשלום (₪${effectiveFinalTotal.toFixed(2)})`);
        return;
      }
    }

    const paymentDetails = {
      paymentMethod,
      installments:
        paymentMethod === "check"
          ? checkInstallments
          : paymentMethod === "credit"
          ? creditInstallments
          : 1,
      cashReceived:
        paymentMethod === "cash"
          ? Number(cashReceived || 0)
          : undefined,
      cashChange:
        paymentMethod === "cash"
          ? Number(cashReceived || 0) - effectiveFinalTotal
          : undefined,
    };

    const transaction: Transaction = {
      id: Date.now(),
      items: cart,
      total: total - giftBagDiscount,
      finalTotal: effectiveFinalTotal,
      discountPercent,
      date: new Date().toLocaleString(),
      dateISO: new Date().toISOString(),
      seller: currentSeller,
      customerId: selectedCustomer?.id,
      customerName:
        selectedCustomer?.name ||
        "מזדמן",
      customerPhone:
        selectedCustomer?.phone ||
        "",
      ...(activeSaleDay ? { saleDayId: activeSaleDay.id } : {}),
      ...(activePreOrderRef ? { preOrderId: activePreOrderRef.orderId } : {}),
      ...paymentDetails,
    };

    setActiveTransactions((prev) => [
      transaction,
      ...prev,
    ]);

    if (activePreOrderRef) {
      setSaleDays(prev => prev.map(day =>
        day.id === activePreOrderRef.saleDayId
          ? { ...day, preOrders: day.preOrders.map(o => o.id === activePreOrderRef.orderId ? { ...o, status: "paid" as const } : o) }
          : day
      ));
      setActivePreOrderRef(null);
    }

    logActivity(`סיום עסקה — ${selectedCustomer?.name || "מזדמן"} ₪${effectiveFinalTotal.toFixed(2)}`);
    setCart([]);
    setManualDiscountAmount("");
    setShowCreditModal(false);
    setShowPaymentModal(false);
    setCashReceived("");
    setCheckInstallments(1);
    setCreditInstallments(1);
  };

  const sendCreditPayment = () => {
    const iframe = document.getElementById("NedarimFrame") as HTMLIFrameElement;
    if (!iframe?.contentWindow) return;
    setCreditPaymentProcessing(true);
    setCreditPaymentError("");
    iframe.contentWindow.postMessage({
      Name: "FinishTransaction2",
      Value: {
        Mosad: "7005701",
        ApiValid: "6qvjd/RCnK",
        PaymentType: "Ragil",
        Currency: "1",
        Zeout: "",
        FirstName: selectedCustomer?.name ?? "לקוח",
        LastName: "",
        Street: "",
        City: "",
        Phone: selectedCustomer?.phone ?? "",
        Mail: "",
        Amount: effectiveFinalTotal.toFixed(2),
        Tashlumim: String(creditInstallments),
        Groupe: "",
        Comment: "",
        CallBack: "",
        Tokef: ""
      }
    }, "*");
  };

  useEffect(() => {
    if (adminTab === "sales" && saleDayDetailId === null && saleDays.length > 0) {
      setSaleDayDetailId(activeSaleDay?.id ?? saleDays[0].id);
    }
  }, [adminTab, saleDays.length]);

  useEffect(() => {
    if (!showCreditModal) return;
    const handleNedarimMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const msg = event.data as { Name?: string; Value?: Record<string, string> };
      if (msg.Name !== "TransactionResponse") return;
      setCreditPaymentProcessing(false);
      const v = msg.Value ?? {};
      if (v.StatusCode === "000" || v.Status === "OK") {
        setCreditPaymentSuccess(true);
        setTimeout(() => completeSale(), 2000);
      } else {
        const parts: string[] = [];
        if (v.StatusCode) parts.push(`קוד: ${v.StatusCode}`);
        if (v.Message) parts.push(v.Message);
        if (v.Status && v.Status !== "OK") parts.push(`סטטוס: ${v.Status}`);
        setCreditPaymentError("הסליקה נכשלה" + (parts.length ? " — " + parts.join(" | ") : ""));
      }
    };
    window.addEventListener("message", handleNedarimMessage);
    return () => window.removeEventListener("message", handleNedarimMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreditModal]);

  const savePendingSale = () => {
    if (cart.length === 0) {
      return;
    }

    const pendingSale: Transaction = {
      id: Date.now(),
      items: cart.map((item) => ({ ...item })),
      total,
      finalTotal,
      discountPercent,
      date: new Date().toLocaleString(),
      dateISO: new Date().toISOString(),
      seller: currentSeller,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || "מזדמן",
      customerPhone: selectedCustomer?.phone || "",
      savedCustomer: selectedCustomer ?? undefined,
      saleDayId: activeSaleDay?.id,
    };

    setPendingSales((prev) => [
      pendingSale,
      ...prev,
    ]);
    setCart([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
  };

  const resumePendingSale = (sale: Transaction) => {
    if (!activeSaleDay || sale.saleDayId !== activeSaleDay.id) {
      const dayName = sale.saleDayId
        ? (saleDays.find(d => d.id === sale.saleDayId)?.name ?? "יום לא ידוע")
        : "ללא שיוך";
      showAlert("לא ניתן לפתוח עסקה", `עסקה זו שייכת ל"${dayName}" ולא ניתן לפתוח אותה כשיום זה אינו פעיל.`);
      return;
    }
    setCart(sale.items.map((item) => ({ ...item })));
    setCurrentSeller(sale.seller);
    setSelectedCustomer(sale.savedCustomer ?? null);
    setCustomerSearch("");
    setCashierMode(true);
    setPendingSales((prev) => prev.filter((s) => s.id !== sale.id));
  };

  const deletePendingSale = (id: number) => {
    showConfirm({
      title: "מחיקת עסקה ממתינה",
      message: "למחוק עסקה זו מההמתנה?",
      confirmLabel: "מחק",
      confirmVariant: "danger",
      onConfirm: () => setPendingSales(prev => prev.filter(sale => sale.id !== id)),
    });
  };

  const processReturn = (sourceTx: Transaction, qtys: Record<number, number>) => {
    const returnItems: CartItem[] = sourceTx.items
      .filter(item => (qtys[item.id] ?? 0) > 0)
      .map(item => ({ ...item, qty: qtys[item.id] }));
    if (returnItems.length === 0) return;
    const grossTotal = returnItems.reduce((s, i) => s + i.price * i.qty, 0);
    const disc = sourceTx.discountPercent ?? 0;
    const returnTotal = grossTotal * (1 - disc / 100);
    const returnTx: Transaction = {
      id: Date.now(),
      items: returnItems,
      total: -grossTotal,
      finalTotal: -returnTotal,
      discountPercent: disc,
      date: new Date().toLocaleString(),
      dateISO: new Date().toISOString(),
      seller: currentSeller,
      customerId: sourceTx.customerId,
      customerName: sourceTx.customerName,
      customerPhone: sourceTx.customerPhone,
      isReturn: true,
      returnForId: sourceTx.id,
      ...(activeSaleDay ? { saleDayId: activeSaleDay.id } : {}),
      ...(sourceTx.preOrderId ? { preOrderId: sourceTx.preOrderId } : {}),
    };
    setActiveTransactions(prev => [returnTx, ...prev]);
    setActiveProducts(prev => prev.map(p => {
      const ret = returnItems.find(i => i.id === p.id);
      return ret ? { ...p, stock: p.stock + ret.qty } : p;
    }));
    logActivity(`החזרה — ${sourceTx.customerName} ₪${returnTotal.toFixed(2)}`);
    setShowReturnModal(false);
    setReturnSearch("");
    setReturnSourceId(null);
    setReturnQtys({});
  };

  const logActivity = (action: string) => {
    setActivityLog(prev => [{ id: Date.now(), date: new Date().toLocaleString(), seller: currentSeller, action }, ...prev].slice(0, 500));
  };

  const showConfirm = (opts: { title: string; message: string; itemName?: string; onConfirm: () => void; confirmLabel?: string; confirmVariant?: BtnVariant }) => {
    setConfirmDialog(opts);
  };

  const addToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const typeLabel = (type: SaleDay["type"]) =>
    type === "walkin" ? "עם הנחה" : type === "walkin-nodiscount" ? "ללא הנחה" : type === "preorder" ? "הזמנות" : "פתוח";

  const showAlert = (title: string, message: string) => setAlertDialog({ title, message });

  // ── button style factories ──
  const btn = mkBtn;
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "9px 8px", border: "none", borderRadius: "9px", fontSize: "13px",
    fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const,
    background: active ? "white" : "transparent",
    color: active ? "#1e40af" : "#64748b",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
    transition: "background 0.12s",
  });
  const iconBtn = (): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", color: "#6b7280",
    lineHeight: 1, padding: "4px", display: "flex", alignItems: "center",
  });
  const navIconBtn = (): React.CSSProperties => ({
    padding: "5px 8px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "8px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", flexShrink: 0,
    transition: "opacity 0.15s",
  });
  const segmentBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
    border: "2px solid", borderColor: active ? "#2563eb" : "#e2e8f0",
    borderRadius: "12px", background: active ? "#eff6ff" : "#f8fafc",
    color: active ? "#2563eb" : "#6b7280", transition: "all 0.12s",
  });
  const productTileBtn = (): React.CSSProperties => ({
    background: "#eff6ff", border: "2px solid transparent", borderRadius: "14px",
    padding: "16px 10px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
    transition: "border-color 0.15s",
  });
  const priceTileBtn = (): React.CSSProperties => ({
    padding: "14px 8px", background: "#eff6ff", border: "2px solid #bfdbfe",
    borderRadius: "12px", fontSize: "18px", fontWeight: 700, cursor: "pointer",
    color: "#1d4ed8", transition: "opacity 0.15s",
  });
  const menuItemBtn = (variant?: "danger" | "primary" | "teal" | "purple"): React.CSSProperties => ({
    width: "100%", padding: "12px 16px", background: "white", border: "none",
    textAlign: "right" as const, fontSize: "14px", fontWeight: 600, cursor: "pointer",
    color: variant === "danger" ? "#dc2626" : variant === "primary" ? "#2563eb" :
           variant === "teal" ? "#0f766e" : variant === "purple" ? "#7c3aed" : "#374151",
    display: "block",
  });
  const navActionBtn = (): React.CSSProperties => ({
    padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "white",
    border: "1px solid rgba(255,255,255,0.3)", borderRadius: "10px",
    fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const,
    transition: "opacity 0.15s",
  });
  const navTabBtn = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
    border: "none", borderBottom: active ? "3px solid #e2e8f0" : "3px solid transparent",
    padding: "12px 16px", fontSize: "14px", fontWeight: active ? 700 : 400,
    cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all 0.15s", marginBottom: "-3px",
  });
  const menuTriggerBtn = (): React.CSSProperties => ({
    padding: "13px", background: "#7c3aed", color: "white",
    border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
    cursor: "pointer", transition: "opacity 0.15s",
  });
  const toggleBtn = (active: boolean, size: "sm" | "md" = "md"): React.CSSProperties => ({
    padding: size === "sm" ? "5px 7px" : "8px 14px",
    borderRadius: size === "sm" ? "8px" : "10px",
    border: `2px solid ${active ? "#7c3aed" : "#e2e8f0"}`,
    background: active ? "#ede9fe" : "white",
    color: active ? "#7c3aed" : "#6b7280",
    fontWeight: 700, cursor: "pointer",
    fontSize: size === "sm" ? "14px" : "13px",
    lineHeight: size === "sm" ? 1 : undefined,
    transition: "all 0.12s",
  });
  const reorderBtn = (): React.CSSProperties => ({
    padding: "2px 8px", fontSize: "12px",
    border: "1px solid #cbd5e1", borderRadius: "4px",
    background: "white", cursor: "pointer", lineHeight: 1, transition: "opacity 0.15s",
  });
  const underlineTabBtn = (active: boolean): React.CSSProperties => ({
    padding: "12px 20px", background: "none", border: "none",
    borderBottom: active ? "3px solid #2563eb" : "3px solid transparent",
    color: active ? "#2563eb" : "#6b7280",
    fontWeight: active ? 700 : 400, fontSize: "14px",
    cursor: "pointer", whiteSpace: "nowrap" as const, marginBottom: "-2px", transition: "all 0.15s",
  });

  // ── central sale-day activation with cart check ──
  const handleActivateSaleDay = (id: number) => {
    if (cart.length > 0) {
      showAlert("לא ניתן להחליף יום מכירה", "קיימים מוצרים בסל. יש להשלים את העסקה, לשמור אותה בהמתנה או לנקות את הסל לפני החלפת יום המכירה.");
      return;
    }
    const day = saleDays.find(d => d.id === id);
    const isActive = day?.isActive ?? false;
    showConfirm({
      title: isActive ? "השהיית יום מכירה" : "הפעלת יום מכירה",
      message: isActive
        ? "להשהות את יום המכירה הנוכחי?"
        : (activeSaleDay ? "הפעלת יום זה תכבה את יום המכירה הנוכחי." : "להפעיל יום מכירה זה?"),
      itemName: day?.name,
      confirmLabel: isActive ? "השהה" : "הפעל",
      confirmVariant: isActive ? "warning" : "success",
      onConfirm: () => toggleSaleDay(id),
    });
  };

  const getFileDateStamp = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}_${String(n.getHours()).padStart(2,'0')}-${String(n.getMinutes()).padStart(2,'0')}`;
  };

  const getEffectivePrice = (basePrice: number) => {
    if (activeSaleDay?.type === "walkin" && activeSaleDay.discountPercent > 0) {
      return Math.round(basePrice * (1 - activeSaleDay.discountPercent / 100) * 100) / 100;
    }
    return basePrice;
  };

  const addSaleDay = () => {
    if (!newSaleDayName) return;
    const newDay: SaleDay = {
      id: Date.now(),
      name: newSaleDayName,
      type: newSaleDayType,
      isActive: false,
      date: newSaleDayDate,
      discountPercent: 0,
      preOrders: [],
      products: activeProducts.map(p => ({ ...p })),
      customers: [],
      transactions: [],
    };
    setSaleDays(prev => [newDay, ...prev]);
    setSaleDayDetailId(newDay.id);
    setSaleDayDetailTab("info");
    setNewSaleDayName("");
    setNewSaleDayDate("");
  };

  const toggleSaleDay = (id: number) => {
    setSaleDays(prev => prev.map(day => ({
      ...day,
      isActive: day.id === id ? !day.isActive : false,
    })));
  };

  const deleteSaleDay = (id: number) => {
    const day = saleDays.find(d => d.id === id);
    showConfirm({
      title: "מחיקת יום מכירה",
      message: "לא ניתן לבטל פעולה זו.",
      itemName: day?.name ?? String(id),
      confirmLabel: "מחק",
      confirmVariant: "danger",
      onConfirm: () => {
        logActivity(`מחיקת יום מכירה — ${day?.name ?? id}`);
        setSaleDays(prev => prev.filter(d => d.id !== id));
      },
    });
  };

  const syncGiftBagItems = (items: CartItem[], saleDayProducts: Product[]): CartItem[] => {
    const bagProduct = saleDayProducts.find(p => p.isGiftBag);
    if (!bagProduct) return items;
    const triggerQty = items
      .filter(i => saleDayProducts.find(p => p.id === i.id)?.giftTrigger)
      .reduce((s, i) => s + i.qty, 0);
    const bagQty = items.filter(i => i.id === bagProduct.id).reduce((s, i) => s + i.qty, 0);
    if (bagQty >= triggerQty) return items; // already enough bags
    const toAdd = triggerQty - bagQty;
    const existing = items.find(i => i.id === bagProduct.id);
    if (existing) return items.map(i => i.id === bagProduct.id ? { ...i, qty: i.qty + toAdd } : i);
    return [...items, { id: bagProduct.id, name: bagProduct.name, price: bagProduct.price, qty: toAdd }];
  };

  const openPreOrderForm = (saleDayId: number, order?: PreOrder) => {
    const saleDay = saleDays.find(d => d.id === saleDayId);
    const dayProducts = saleDay?.products ?? activeProducts;
    const rawItems = order?.items ? order.items.map(i => ({ ...i })) : [];
    setPreOrderForm({
      saleDayId,
      orderId: order?.id,
      customerName: order?.customerName ?? "",
      customerPhone: order?.customerPhone ?? "",
      notes: order?.notes ?? "",
      items: syncGiftBagItems(rawItems, dayProducts),
    });
    setPoProductId(dayProducts[0]?.id ?? 0);
    setPoQty(1);
  };

  const addItemToPreOrderForm = () => {
    if (!preOrderForm) return;
    const saleDay = saleDays.find(d => d.id === preOrderForm.saleDayId);
    const dayProducts = saleDay?.products ?? activeProducts;
    const product = dayProducts.find(p => p.id === poProductId) ?? activeProducts.find(p => p.id === poProductId);
    if (!product) return;
    setPreOrderForm(prev => {
      if (!prev) return prev;
      const existing = prev.items.find(i => i.id === product.id && i.price > 0);
      let newItems: CartItem[];
      if (existing) {
        newItems = prev.items.map(i => (i.id === product.id && i.price > 0) ? { ...i, qty: i.qty + poQty } : i);
      } else {
        newItems = [...prev.items, { id: product.id, name: product.name, price: product.price, qty: poQty }];
      }
      return { ...prev, items: syncGiftBagItems(newItems, dayProducts) };
    });
    setPoQty(1);
  };

  const removeItemFromPreOrderForm = (itemId: number) => {
    setPreOrderForm(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev);
  };

  const savePreOrder = () => {
    if (!preOrderForm || !preOrderForm.customerName) return;
    setSaleDays(prev => prev.map(day => {
      if (day.id !== preOrderForm.saleDayId) return day;
      if (preOrderForm.orderId) {
        return {
          ...day,
          preOrders: day.preOrders.map(o =>
            o.id === preOrderForm.orderId
              ? { ...o, customerName: preOrderForm.customerName, customerPhone: preOrderForm.customerPhone, notes: preOrderForm.notes, items: preOrderForm.items }
              : o
          ),
        };
      }
      const newOrder: PreOrder = {
        id: Date.now(),
        customerName: preOrderForm.customerName,
        customerPhone: preOrderForm.customerPhone,
        notes: preOrderForm.notes,
        items: preOrderForm.items,
        status: "pending",
      };
      return { ...day, preOrders: [newOrder, ...day.preOrders] };
    }));
    setPreOrderForm(null);
  };

  const deletePreOrder = (saleDayId: number, orderId: number) => {
    const day = saleDays.find(d => d.id === saleDayId);
    const order = day?.preOrders.find(o => o.id === orderId);
    showConfirm({
      title: "מחיקת הזמנה",
      message: "למחוק את ההזמנה?",
      itemName: order?.customerName ?? String(orderId),
      confirmLabel: "מחק",
      confirmVariant: "danger",
      onConfirm: () => {
        logActivity(`מחיקת הזמנה — ${order?.customerName ?? orderId}`);
        setSaleDays(prev => prev.map(d =>
          d.id === saleDayId ? { ...d, preOrders: d.preOrders.filter(o => o.id !== orderId) } : d
        ));
      },
    });
  };

  const buildOrderHtml = (order: PreOrder, dayName: string) => {
    const saleDay = saleDays.find(d => d.preOrders.some(o => o.id === order.id));
    const products = saleDay?.products ?? activeProducts;
    const bagProduct = products.find(p => p.isGiftBag) ?? null;
    const giftFreeQtyOrder = order.items
      .filter(i => products.find(p => p.id === i.id)?.giftTrigger)
      .reduce((s, i) => s + i.qty, 0);
    const bagInOrder = bagProduct ? order.items.filter(i => i.id === bagProduct.id).reduce((s, i) => s + i.qty, 0) : 0;
    const paidBagsOrder = Math.max(0, bagInOrder - giftFreeQtyOrder);

    const displayItems: { name: string; qty: number; price: number }[] = [
      ...order.items
        .filter(i => !bagProduct || i.id !== bagProduct.id)
        .map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      ...(bagProduct && paidBagsOrder > 0 ? [{ name: bagProduct.name, qty: paidBagsOrder, price: bagProduct.price }] : []),
      ...(bagProduct && giftFreeQtyOrder > 0 ? [{ name: bagProduct.name + " (מתנה)", qty: giftFreeQtyOrder, price: 0 }] : []),
    ];

    const total = displayItems.reduce((s, i) => s + i.price * i.qty, 0);
    const checkbox = `<div style="width:18px;height:18px;border:2px solid #333;border-radius:2px;margin:0 auto;"></div>`;
    const rows = displayItems.map(i =>
      `<tr><td style="text-align:center">${checkbox}</td><td style="text-align:center">${i.qty}</td><td>${i.name}</td><td style="text-align:center">₪${i.price.toFixed(2)}</td><td style="text-align:center">₪${(i.price * i.qty).toFixed(2)}</td></tr>`
    ).join("");
    const giftLine = bagProduct && giftFreeQtyOrder > 0
      ? `<div class="gift-note">🎁 מתנה! הינך זכאי ל-${giftFreeQtyOrder} ${bagProduct.name} במתנה</div>`
      : "";
    return `
      <div class="order">
        <div class="day-name">${dayName}</div>
        <div class="order-header">
          <strong>${order.customerName}</strong>
          ${order.customerPhone ? ` &nbsp;|&nbsp; ${order.customerPhone}` : ""}
        </div>
        ${order.notes ? `<div class="notes">הערות: ${order.notes}</div>` : ""}
        <table>
          <thead><tr><th style="width:36px;text-align:center">סימון</th><th style="width:44px;text-align:center">כמות</th><th>מוצר</th><th style="text-align:center">מחיר ליחידה</th><th style="text-align:center">סה"כ</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">סה"כ לתשלום: ₪${total.toFixed(2)}</div>
        ${giftLine}
      </div>`;
  };

  const printStyles = `
    body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; font-size: 14px; }
    @page { margin: 80px 40px 40px 40px; }
    .order { border: 1px solid #ccc; border-radius: 8px; padding: 14px; margin-bottom: 20px; page-break-after: always; break-after: page; }
    .order:last-child { page-break-after: avoid; break-after: avoid; }
    .order-header { font-size: 16px; margin-bottom: 6px; }
    .day-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; border-bottom: 2px solid #ccc; padding-bottom: 6px; }
    .notes { color: #059669; font-size: 13px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 6px 8px; border: 1px solid #ddd; text-align: right; }
    th { background: #f1f5f9; font-weight: bold; }
    .total { font-weight: bold; font-size: 15px; margin-top: 10px; text-align: left; }
    .gift-note { font-weight: bold; font-size: 15px; margin-top: 8px; color: #7c3aed; border: 2px dashed #7c3aed; padding: 6px 10px; border-radius: 6px; text-align: center; }
  `;

  const printSingleOrder = (order: PreOrder, dayName: string) => {
    const w = window.open("", "_blank", "width=650,height=800");
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>הזמנה - ${order.customerName}</title><style>${printStyles}</style></head><body>${buildOrderHtml(order, dayName)}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const printAllOrdersList = (orders: { order: PreOrder; dayName: string }[]) => {
    const body = orders.map(({ order, dayName }) => buildOrderHtml(order, dayName)).join("");
    const w = window.open("", "_blank", "width=650,height=900");
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>כל ההזמנות</title><style>${printStyles}</style></head><body>${body}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const loadPreOrderToCart = (order: PreOrder, saleDayId: number, orderId: number) => {
    setCart(order.items.map(item => {
      const product = activeProducts.find(p =>
        p.id === item.id ||
        p.name === item.name ||
        item.name.includes(p.name) ||
        p.name.includes(item.name)
      );
      return { ...item, price: product?.price ?? item.price };
    }));
    const customer = activeCustomers.find(c => c.name === order.customerName)
      ?? (order.customerName ? { id: 0, name: order.customerName, phone: order.customerPhone ?? "", idNumber: "", customerType: "1" as CustomerType } : null);
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setCashierMode(true);
    setActivePreOrderRef({ orderId, saleDayId });
  };

  const importPreOrdersFromExcel = async (
    e: React.ChangeEvent<HTMLInputElement>,
    saleDayId: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    }) as Record<string, string>[];

    const FIXED_COLS = new Set([
      "תאריך יצירה", "שם משפחה", "שם פרטי",
      "טלפון", "טלפון נוסף", "מייל", "הערות",
    ]);

    // collect all product column names from headers
    const productColNames: string[] = [];
    for (const row of jsonData) {
      for (const colName of Object.keys(row)) {
        if (!FIXED_COLS.has(colName) && !productColNames.includes(colName)) {
          productColNames.push(colName);
        }
      }
    }

    const importedOrders: PreOrder[] = [];
    let idCounter = Date.now();

    const targetDay = saleDays.find(d => d.id === saleDayId);
    const dayProducts = targetDay?.products ?? activeProducts;

    for (const row of jsonData) {
      const firstName = (row["שם פרטי"] || "").trim();
      const lastName = (row["שם משפחה"] || "").trim();
      const customerName = [firstName, lastName].filter(Boolean).join(" ");
      if (!customerName) continue;

      const customerPhone = (row["טלפון"] || "").replace(/\D/g, "");
      const notes = (row["הערות"] || "").trim();

      const items: CartItem[] = [];
      let itemIdSuffix = 0;

      for (const [colName, colValue] of Object.entries(row)) {
        if (FIXED_COLS.has(colName)) continue;
        const qty = parseInt(String(colValue), 10);
        if (!qty || qty <= 0) continue;

        const matched = dayProducts.find(
          (p) =>
            p.name === colName ||
            colName.includes(p.name) ||
            p.name.includes(colName)
        );

        items.push({
          id: matched ? matched.id : -(idCounter + itemIdSuffix++),
          name: colName,
          price: matched?.price ?? 0,
          qty,
        });
      }

      if (items.length === 0) continue;

      importedOrders.push({
        id: idCounter++,
        customerName,
        customerPhone,
        notes,
        items,
        status: "pending",
      });
    }

    setSaleDays((prev) =>
      prev.map((day) => {
        if (day.id !== saleDayId) return day;
        const existingCustomers = day.customers ?? [];
        const newCustomers: Customer[] = [];
        for (const order of importedOrders) {
          const alreadyExists = existingCustomers.some(c =>
            (order.customerPhone && c.phone === order.customerPhone) ||
            c.name === order.customerName
          );
          const alreadyAdded = newCustomers.some(c =>
            (order.customerPhone && c.phone === order.customerPhone) ||
            c.name === order.customerName
          );
          if (!alreadyExists && !alreadyAdded) {
            newCustomers.push({
              id: Date.now() * 1000 + newCustomers.length,
              name: order.customerName,
              phone: order.customerPhone,
              idNumber: "",
              customerType: "3",
            });
          }
        }
        const existingProducts = day.products ?? [];
        const newProducts: Product[] = [];
        let pIdCounter = Date.now() + 10000;
        for (const colName of productColNames) {
          const alreadyExists = existingProducts.some(p =>
            p.name === colName || colName.includes(p.name) || p.name.includes(colName)
          );
          if (!alreadyExists) {
            newProducts.push({
              id: pIdCounter++,
              name: colName,
              price: 0,
              category: "כללי",
              stock: 0,
            });
          }
        }

        const normPhone = (p: string) => String(p || "").replace(/\D/g, "").replace(/^0+/, "");
        const existingOrderKeys = new Set(day.preOrders.map(o => `${o.customerName}|${normPhone(o.customerPhone)}`));
        const uniqueOrders = importedOrders.filter(o => !existingOrderKeys.has(`${o.customerName}|${normPhone(o.customerPhone)}`));
        const skipped = importedOrders.length - uniqueOrders.length;
        if (skipped > 0) addToast(`${skipped} הזמנות כבר קיימות ולא יובאו שנית. יובאו ${uniqueOrders.length} הזמנות חדשות.`, "warning");

        return {
          ...day,
          preOrders: [...day.preOrders, ...uniqueOrders],
          customers: [...existingCustomers, ...newCustomers],
          products: [...existingProducts, ...newProducts],
        };
      })
    );

    addToast(`יובאו ${importedOrders.length} הזמנות בהצלחה`, "success");
    e.target.value = "";
  };


  const exportData = () => {
    const allProductNames = [
      ...new Set(activeTransactions.flatMap((t) => t.items.map((i) => i.name))),
    ];
    const transactionsRows = activeTransactions.map((t) => {
      const paymentLabels: Record<string, string> = { cash: "מזומן", credit: "אשראי", check: "המחאה" };
      const row: Record<string, string | number> = {
        תאריך: t.date,
        לקוח: t.customerName,
        טלפון: t.customerPhone,
        מוכר: t.seller,
        שיטת_תשלום: paymentLabels[t.paymentMethod || ""] || t.paymentMethod || "",
        תשלומים: t.installments || 1,
        סכום: t.finalTotal,
      };
      for (const name of allProductNames) {
        const item = t.items.find((i) => i.name === name);
        row[name] = item ? item.qty : "";
      }
      return row;
    });

    const customersRows = activeCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      idNumber: c.idNumber,
      customerType: c.customerType,
    }));

    const productsRows = activeProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
    }));

    const sellersRows = sellers.map((seller) => ({
      מוכר: seller.name,
      מנהל: seller.isAdmin ? "כן" : "לא",
    }));

    const pendingRows = pendingSales.map((t) => ({
      תאריך: t.date,
      לקוח: t.customerName,
      טלפון: t.customerPhone,
      מוכר: t.seller,
      סכום: t.finalTotal,
      מוצרים: t.items
        .map((i) => `${i.name} x${i.qty}`)
        .join(" | "),
    }));

    const workbook = XLSX.utils.book_new();

    const rtlView = [{ rightToLeft: true, RTL: true }];
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsRows);
    (transactionsSheet as any)["!views"] = rtlView;
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "עסקאות");

    const customersSheet = XLSX.utils.json_to_sheet(customersRows);
    (customersSheet as any)["!views"] = rtlView;
    XLSX.utils.book_append_sheet(workbook, customersSheet, "לקוחות");

    const productsSheet = XLSX.utils.json_to_sheet(productsRows);
    (productsSheet as any)["!views"] = rtlView;
    XLSX.utils.book_append_sheet(workbook, productsSheet, "מוצרים");

    const sellersSheet = XLSX.utils.json_to_sheet(sellersRows);
    (sellersSheet as any)["!views"] = rtlView;
    XLSX.utils.book_append_sheet(workbook, sellersSheet, "מוכרים");

    const pendingSheet = XLSX.utils.json_to_sheet(pendingRows);
    (pendingSheet as any)["!views"] = rtlView;
    XLSX.utils.book_append_sheet(workbook, pendingSheet, "עסקאות בהמתנה");

    XLSX.writeFile(workbook, `full_export_${getFileDateStamp()}.xlsx`, { bookType: "xlsx" });
  };

  const addProduct = () => {
    if (currentRole !== "admin") {
      return;
    }

    if (!newName || !newCategory) {
      return;
    }

    const parsedLevels = newPriceLevels
      .split(/[,\s]+/)
      .map(s => Number(s.trim()))
      .filter(n => n > 0);
    setActiveProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newName,
        price: Number(newPrice),
        category: newCategory,
        stock: 0,
        ...(parsedLevels.length > 0 ? { priceLevels: parsedLevels } : {}),
        ...(newGiftTrigger ? { giftTrigger: true } : {}),
        ...(newIsGiftBag ? { isGiftBag: true } : {}),
      },
    ]);

    setNewName("");
    setNewPrice("");
    setNewCategory("");
    setNewPriceLevels("");
    setNewGiftTrigger(false);
    setNewIsGiftBag(false);
  };
  // ── ניהול מלאי ──
  const getInventoryForDay = (day: SaleDay): InventoryItem[] => {
    if (day.inventory && day.inventory.length > 0) return day.inventory;
    return (day.products ?? []).map(p => ({
      productId: p.id,
      productName: p.name,
      requiredQty: 0,
      actualInQty: 0,
    }));
  };

  const computeInventoryRow = (inv: InventoryItem, txs: Transaction[], preOrders?: PreOrder[]) => {
    let netSold = 0;
    let soldAmount = 0;
    for (const t of txs) {
      const item = t.items.find(i => i.id === inv.productId);
      if (!item) continue;
      const disc = t.discountPercent ?? 0;
      const lineAmount = item.price * item.qty * (1 - disc / 100);
      if (t.isReturn) { netSold -= item.qty; soldAmount -= lineAmount; }
      else            { netSold += item.qty; soldAmount += lineAmount; }
    }
    const remainingQty = inv.actualInQty - netSold;
    const varianceQty = inv.actualEndQty != null ? inv.actualEndQty - remainingQty : undefined;

    let reservedQty: number | undefined;
    let availableQty: number | undefined;
    if (preOrders) {
      reservedQty = preOrders
        .filter(o => o.status === "pending")
        .reduce((sum, o) => {
          const item = o.items.find(i => i.id === inv.productId);
          return sum + (item?.qty ?? 0);
        }, 0);
      availableQty = remainingQty - reservedQty;
    }

    const shortageQty = Math.max(inv.requiredQty - inv.actualInQty, 0);
    return { ...inv, soldQty: netSold, soldAmount: Math.round(soldAmount * 100) / 100, remainingQty, varianceQty, reservedQty, availableQty, shortageQty };
  };

  const getCashierProductRemaining = (productId: number): { remaining: number; reserved: number | null; available: number | null } | null => {
    if (!activeSaleDay) return null;
    const inv = (activeSaleDay.inventory ?? []).find(i => i.productId === productId);
    if (!inv) return null;
    const txs = activeSaleDay.transactions ?? [];
    const preOrders = activeSaleDay.type === "preorder" ? (activeSaleDay.preOrders ?? []) : undefined;
    const row = computeInventoryRow(inv, txs, preOrders);
    let reserved = row.reservedQty ?? null;
    let available = row.availableQty ?? null;
    const cartQty = cart.filter(i => i.id === productId).reduce((s, i) => s + i.qty, 0);
    return {
      remaining: row.remainingQty - cartQty,
      reserved,
      available,
    };
  };

  const checkCanAddToCart = (productId: number, currentCartQty: number): string | null => {
    if (!activeSaleDay) return null;
    const inv = (activeSaleDay.inventory ?? []).find(i => i.productId === productId);
    if (!inv) return null;
    const txs = activeSaleDay.transactions ?? [];
    const productName = activeProducts.find(p => p.id === productId)?.name ?? String(productId);

    if (activePreOrderRef) {
      const preOrder = (activeSaleDay.preOrders ?? []).find(o => o.id === activePreOrderRef.orderId);
      const orderedQty = preOrder?.items.find(i => i.id === productId)?.qty ?? 0;
      const row = computeInventoryRow(inv, txs, activeSaleDay.preOrders ?? []);
      if (orderedQty > 0) {
        if (row.remainingQty <= currentCartQty) return `אין מלאי מספיק עבור "${productName}"`;
      } else {
        if ((row.availableQty ?? 0) <= currentCartQty) return `"${productName}" שמור להזמנות — אין מלאי פנוי`;
      }
    } else {
      const row = computeInventoryRow(inv, txs, activeSaleDay.type === "preorder" ? (activeSaleDay.preOrders ?? []) : undefined);
      const avail = row.availableQty ?? row.remainingQty;
      if (avail <= currentCartQty) return `אין מלאי זמין עבור "${productName}"`;
    }
    return null;
  };

  const getSaleDayYear = (day: SaleDay): number => {
    const d = day.date ? new Date(day.date) : new Date(day.id);
    return Number.isNaN(d.getTime()) ? new Date(day.id).getFullYear() : d.getFullYear();
  };

  const getLastYearDay = (day: SaleDay): SaleDay | null => {
    const thisYear = getSaleDayYear(day);
    return saleDays.find(d =>
      getSaleDayYear(d) === thisYear - 1 && d.name === day.name
    ) ?? null;
  };

  const fillRequiredFromLastYear = (day: SaleDay) => {
    const lastYear = getLastYearDay(day);
    if (lastYear) {
      const inv = getInventoryForDay(day);
      const lastInv = getInventoryForDay(lastYear);
      const lastTxs = lastYear.transactions ?? [];
      const updated = inv.map(item => {
        const lastItem = lastInv.find(i => i.productId === item.productId);
        if (!lastItem) return item;
        const lastRow = computeInventoryRow(lastItem, lastTxs);
        return { ...item, requiredQty: lastRow.soldQty };
      });
      setSaleDays(prev => prev.map(d => d.id === day.id ? { ...d, inventory: updated } : d));
    } else {
      lastYearFileRef.current?.click();
    }
  };

  const importLastYearFromXlsx = (day: SaleDay, file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      const inv = getInventoryForDay(day);
      const updated = inv.map(item => {
        const row = rows.find(r => String(r["מוצר"] ?? "").trim() === item.productName.trim());
        if (!row) return item;
        const val = Number(row["נמכר"] ?? 0);
        return { ...item, requiredQty: val };
      });
      setSaleDays(prev => prev.map(d => d.id === day.id ? { ...d, inventory: updated } : d));
    };
    reader.readAsArrayBuffer(file);
  };

  const syncPreorderRequiredQty = (day: SaleDay) => {
    const base = getInventoryForDay(day);
    const updated = base.map(item => {
      const ordered = (day.preOrders ?? [])
        .flatMap(o => o.items)
        .filter(i => i.id === item.productId)
        .reduce((s, i) => s + i.qty, 0);
      return { ...item, requiredQty: ordered };
    });
    setSaleDays(prev => prev.map(d => d.id === day.id ? { ...d, inventory: updated } : d));
  };

  const updateInventoryField = (dayId: number, productId: number, field: "requiredQty" | "plannedQty" | "actualInQty" | "actualEndQty", value: number) => {
    setSaleDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      const base = getInventoryForDay(d);
      const updated = base.map(item =>
        item.productId === productId ? { ...item, [field]: value } : item
      );
      return { ...d, inventory: updated };
    }));
  };

  const exportInventoryToXlsx = (day: SaleDay) => {
    const inv = getInventoryForDay(day);
    const txs = day.transactions ?? [];
    const isPreorder = day.type === "preorder";
    const rows = inv.map(item => {
      const r = computeInventoryRow(item, txs, isPreorder ? (day.preOrders ?? []) : undefined);
      const row: Record<string, unknown> = {
        מוצר: r.productName, "כמות הדרושה": r.requiredQty, "כמות שנארזה": r.actualInQty, "כמות חסרה": r.shortageQty, נמכר: r.soldQty, "סכום נמכר": r.soldAmount,
      };
      if (isPreorder) { row["שמור"] = r.reservedQty ?? 0; row["פנוי"] = r.availableQty ?? r.remainingQty; }
      row["נשאר"] = r.remainingQty;
      if (r.actualEndQty != null) { row["נספר בפועל"] = r.actualEndQty; row["סטייה"] = r.varianceQty ?? ""; }
      return row;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    (ws as any)["!views"] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(wb, ws, "מלאי");
    XLSX.writeFile(wb, `מלאי_${day.name}_${getFileDateStamp()}.xlsx`);
  };

  const exportSaleDayData = (dayId: number) => {
    const day = saleDays.find(d => d.id === dayId);
    if (!day) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      source: "saleDayExport",
      saleDay: day,
      sellers,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = day.name.replace(/[^\w֐-׿]/g, "_");
    a.href = url; a.download = `יום_מכירה_${safeName}_${dayId}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importSaleDayData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const payload = JSON.parse(ev.target?.result as string) as {
          exportedAt: string;
          source?: string;
          saleDay: SaleDay;
          sellers?: { name: string; isAdmin: boolean }[];
        };
        if (payload.source !== "saleDayExport" || !payload.saleDay?.id) {
          addToast("קובץ לא תקין — ודא שזהו קובץ ייצוא יום מכירה", "error"); return;
        }
        const imported = payload.saleDay;

        // ── ניתוח מוכרים חדשים ──
        const localSellerNames = new Set(sellers.map(s => s.name));
        const newSellers = (payload.sellers ?? []).filter(s => !localSellerNames.has(s.name));

        // ── חיפוש יום קיים ──
        const existing = saleDays.find(d => d.id === imported.id) ?? saleDays.find(d => d.name === imported.name);

        // ── בניית הודעת אישור ──
        const confirmLines: string[] = [];
        if (!existing) confirmLines.push(`יום המכירה "${imported.name}" לא נמצא — יתווסף כחדש`);
        if (newSellers.length > 0) confirmLines.push(`יובאו ${newSellers.length} מוכרים חדשים: ${newSellers.map(s => s.name).join(", ")}`);
        if (existing) confirmLines.push(`סנכרון נתונים ליום "${existing.name}"`);

        showConfirm({
          title: "ייבוא יום מכירה",
          message: confirmLines.join("\n"),
          confirmLabel: "ייבא",
          confirmVariant: "primary",
          onConfirm: () => {
            if (newSellers.length > 0) setSellers(prev => [...prev, ...newSellers]);

            if (!existing) {
              setSaleDays(prev => [...prev, imported]);
              addToast(`יום מכירה "${imported.name}" נוסף בהצלחה`, "success");
              return;
            }

            // ── עסקאות: רק חדשות לפי id ──
            const localTxIds = new Set((existing.transactions ?? []).map(t => t.id));
            const newTxs = (imported.transactions ?? []).filter(t => !localTxIds.has(t.id));

            // ── לקוחות: לפי id / טלפון מנורמל / שם+טלפון ──
            const localNorm = (p: string) => String(p || "").replace(/\D/g, "").replace(/^0+/, "");
            const localCustIds = new Set((existing.customers ?? []).map(c => c.id));
            const localCustPhones = new Set((existing.customers ?? []).map(c => localNorm(c.phone)));
            const localCustNamePhone = new Set((existing.customers ?? []).map(c => `${c.name}|${localNorm(c.phone)}`));
            const newCustomers = (imported.customers ?? []).filter(c =>
              !localCustIds.has(c.id) &&
              !localCustPhones.has(localNorm(c.phone)) &&
              !localCustNamePhone.has(`${c.name}|${localNorm(c.phone)}`)
            );

            // ── הזמנות: pending→paid מהטאבלט; לא לדרוס פריטים/הערות ──
            let ordersUpdated = 0;
            const importedOrderMap = new Map((imported.preOrders ?? []).map(o => [o.id, o]));
            const mergedOrders = (existing.preOrders ?? []).map(o => {
              const imp = importedOrderMap.get(o.id);
              if (!imp) return o;
              importedOrderMap.delete(o.id);
              if (o.status === "pending" && imp.status === "paid") {
                ordersUpdated++;
                return { ...o, status: "paid" as const };
              }
              return o;
            });
            importedOrderMap.forEach(o => mergedOrders.push(o));

            // ── מלאי: המחשב הראשי שומר על הכל חוץ מ-actualEndQty ──
            let endQtyUpdated = 0;
            const conflicts: string[] = [];
            const importedInvMap = new Map((imported.inventory ?? []).map(i => [i.productId, i]));
            const localInv = existing.inventory ?? [];
            const mergedInv = localInv.map(local => {
              const imp = importedInvMap.get(local.productId);
              if (!imp) return local;
              importedInvMap.delete(local.productId);
              let actualEndQty = local.actualEndQty;
              if (imp.actualEndQty != null) {
                if (local.actualEndQty == null) {
                  actualEndQty = imp.actualEndQty;
                  endQtyUpdated++;
                } else if (local.actualEndQty !== imp.actualEndQty) {
                  conflicts.push(`${local.productName}: מקומי=${local.actualEndQty}, מיובא=${imp.actualEndQty}`);
                }
              }
              return { ...local, actualEndQty };
            });

            // ── מוצרים: הוסף מוצרים חדשים מהקובץ שלא קיימים מקומית (לפי id ואז לפי שם) ──
            const localProductIds = new Set((existing.products ?? []).map(p => p.id));
            const localProductNames = new Set((existing.products ?? []).map(p => p.name));
            const newProducts = (imported.products ?? []).filter(p => !localProductIds.has(p.id) && !localProductNames.has(p.name));
            const mergedProducts = [...(existing.products ?? []), ...newProducts];

            const merged: SaleDay = {
              ...existing,
              transactions: [...(existing.transactions ?? []), ...newTxs],
              customers: [...(existing.customers ?? []), ...newCustomers],
              preOrders: mergedOrders,
              inventory: mergedInv,
              products: mergedProducts,
            };
            setSaleDays(prev => prev.map(d => d.id === existing.id ? merged : d));

            const summaryParts = [
              `${newTxs.length} עסקאות חדשות`,
              `${newCustomers.length} לקוחות חדשים`,
              `${ordersUpdated} הזמנות עודכנו`,
              `${endQtyUpdated} ערכי מלאי עודכנו`,
            ];
            addToast(`סנכרון "${existing.name}" הושלם: ${summaryParts.join(" | ")}`, conflicts.length ? "warning" : "success");
            if (conflicts.length) addToast(`${conflicts.length} התנגשויות ב"נספר בפועל" (לא עודכנו)`, "warning");
          },
        });
      } catch {
        addToast("שגיאה בקריאת הקובץ — ודא שזהו קובץ ייצוא תקין", "error");
      }
    };
    reader.readAsText(file);
  };

  const exportAnnualInventoryToXlsx = (year: number) => {
    const daysInYear = saleDays.filter(d => getSaleDayYear(d) === year);
    const allProductIds = new Set(daysInYear.flatMap(d => getInventoryForDay(d).map(i => i.productId)));
    const rows = Array.from(allProductIds).map(pid => {
      const firstName = daysInYear.flatMap(d => getInventoryForDay(d)).find(i => i.productId === pid)?.productName ?? String(pid);
      const agg = daysInYear.reduce((acc, day) => {
        const inv = getInventoryForDay(day).find(i => i.productId === pid);
        if (!inv) return acc;
        const r = computeInventoryRow(inv, day.transactions ?? []);
        return { required: acc.required + r.requiredQty, actualIn: acc.actualIn + r.actualInQty, sold: acc.sold + r.soldQty, amount: acc.amount + r.soldAmount, remaining: acc.remaining + r.remainingQty };
      }, { required: 0, actualIn: 0, sold: 0, amount: 0, remaining: 0 });
      return { מוצר: firstName, "סה\"כ דרוש": agg.required, "סה\"כ נכנס": agg.actualIn, "סה\"כ נמכר": agg.sold, "סכום נמכר": Math.round(agg.amount * 100) / 100, "סה\"כ נשאר": agg.remaining };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    (ws as any)["!views"] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(wb, ws, `מלאי ${year}`);
    XLSX.writeFile(wb, `מלאי_שנתי_${year}_${getFileDateStamp()}.xlsx`);
  };

const exportBackup = () => {
  const backup = {
    products,
    customers,
    transactions,
    sellers,
    saleDays,
    warehouseItems,
    pendingSales,
    activityLog,
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  const n = new Date();
  const stamp = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}_${String(n.getHours()).padStart(2,'0')}-${String(n.getMinutes()).padStart(2,'0')}`;
  a.download = `backup_${stamp}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

const importBackup = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = "";

  let backup: Record<string, unknown>;
  try {
    const text = await file.text();
    backup = JSON.parse(text);
  } catch {
    addToast("קובץ גיבוי לא תקין", "error");
    return;
  }

  showConfirm({
    title: "שחזור גיבוי",
    message: "שחזור גיבוי ידרוס את כל הנתונים הקיימים. להמשיך?",
    confirmLabel: "שחזר",
    confirmVariant: "danger",
    onConfirm: () => {
      if (backup.products) setProducts(backup.products as typeof products);
      if (backup.customers) setCustomers(backup.customers as typeof customers);
      if (backup.transactions) setTransactions(backup.transactions as typeof transactions);
      if (backup.sellers) {
        const s = backup.sellers as ({ name: string; isAdmin: boolean }[] | string[]);
        if (s.length > 0 && typeof s[0] === "string") {
          setSellers((s as string[]).map(name => ({ name, isAdmin: false })));
        } else {
          setSellers(s as { name: string; isAdmin: boolean }[]);
        }
      }
      if (backup.saleDays) setSaleDays(backup.saleDays as typeof saleDays);
      if (backup.warehouseItems) setWarehouseItems(backup.warehouseItems as typeof warehouseItems);
      if (backup.pendingSales) setPendingSales(backup.pendingSales as typeof pendingSales);
      if (backup.activityLog) setActivityLog(backup.activityLog as typeof activityLog);
      logActivity(`שחזור גיבוי — ${file.name}`);
      addToast("הגיבוי שוחזר בהצלחה", "success");
    },
  });
};

  const getWarehouseSummary = (year: number) => {
    const daysInYear = saleDays.filter(d => getSaleDayYear(d) === year);
    return warehouseItems.filter(w => w.year === year).map(item => {
      let requiredTotal = 0, plannedTotal = 0, packedTotal = 0, returnedTotal = 0;
      const dayDetails: Array<{
        dayId: number; dayName: string; productName: string;
        requiredQty: number; plannedQty: number; actualInQty: number; soldQty: number;
        remainingQty: number; actualEndQty?: number;
      }> = [];
      for (const day of daysInYear) {
        const inv = getInventoryForDay(day);
        for (const invItem of inv.filter(i => i.warehouseCode === item.code)) {
          requiredTotal += invItem.requiredQty;
          plannedTotal += invItem.plannedQty ?? 0;
          packedTotal += invItem.actualInQty;
          if (invItem.actualEndQty != null) returnedTotal += invItem.actualEndQty;
          const row = computeInventoryRow(invItem, day.transactions ?? []);
          dayDetails.push({
            dayId: day.id, dayName: day.name, productName: invItem.productName,
            requiredQty: invItem.requiredQty, plannedQty: invItem.plannedQty ?? 0,
            actualInQty: invItem.actualInQty,
            soldQty: row.soldQty, remainingQty: row.remainingQty,
            actualEndQty: invItem.actualEndQty,
          });
        }
      }
      const baseWarehouseQty = item.openingQty + item.addedQty + item.adjustmentQty;
      const currentQty = baseWarehouseQty - packedTotal + returnedTotal;
      const remainingToPackQty = Math.max(plannedTotal - packedTotal, 0);
      const shortageQty = Math.max(remainingToPackQty - currentQty, 0);
      const status =
        plannedTotal === 0 ? "אין דרישה" :
        shortageQty > 0 ? "חסר" :
        remainingToPackQty === 0 ? "הושלם" : "תקין";
      return { ...item, requiredTotal, plannedTotal, packedTotal, returnedTotal, baseWarehouseQty, currentQty, remainingToPackQty, shortageQty, status, dayDetails };
    });
  };

  const getSupplierReport = (year: number) => {
    const daysInYear = saleDays.filter(d => getSaleDayYear(d) === year);
    const items = warehouseItems.filter(w => w.year === year);
    const supplierMap = new Map<string, {
      supplier: string;
      products: Array<{
        code: string; name: string;
        receivedQty: number; costPrice: number; totalCost: number;
        soldQty: number; soldAmount: number; profit: number;
        cogs: number; grossProfit: number; remainingQty: number; remainingValue: number;
      }>;
    }>();
    for (const item of items) {
      const supplier = item.supplier?.trim() || "ללא ספק";
      if (!supplierMap.has(supplier)) supplierMap.set(supplier, { supplier, products: [] });
      const entry = supplierMap.get(supplier)!;
      const receivedQty = item.openingQty + item.addedQty + item.adjustmentQty;
      const costPrice = item.costPrice ?? 0;
      const totalCost = receivedQty * costPrice;
      let soldQty = 0, soldAmount = 0;
      for (const day of daysInYear) {
        const inv = getInventoryForDay(day);
        for (const invItem of inv.filter(i => i.warehouseCode === item.code)) {
          const row = computeInventoryRow(invItem, day.transactions ?? []);
          soldQty += row.soldQty;
          soldAmount += row.soldAmount;
        }
      }
      const profit = soldAmount - totalCost;
      const cogs = soldQty * costPrice;           // cost of goods actually sold
      const grossProfit = soldAmount - cogs;       // realized gross profit
      const remainingQty = receivedQty - soldQty; // units still in system
      const remainingValue = remainingQty * costPrice; // value of remaining inventory
      entry.products.push({ code: item.code, name: item.name, receivedQty, costPrice, totalCost, soldQty, soldAmount, profit, cogs, grossProfit, remainingQty, remainingValue });
    }
    return [...supplierMap.values()].map(s => ({
      ...s,
      totalReceived: s.products.reduce((a, p) => a + p.receivedQty, 0),
      totalCost: s.products.reduce((a, p) => a + p.totalCost, 0),
      totalSoldQty: s.products.reduce((a, p) => a + p.soldQty, 0),
      totalSoldAmount: s.products.reduce((a, p) => a + p.soldAmount, 0),
      totalProfit: s.products.reduce((a, p) => a + p.profit, 0),
      totalCogs: s.products.reduce((a, p) => a + p.cogs, 0),
      totalGrossProfit: s.products.reduce((a, p) => a + p.grossProfit, 0),
      totalRemainingQty: s.products.reduce((a, p) => a + p.remainingQty, 0),
      totalRemainingValue: s.products.reduce((a, p) => a + p.remainingValue, 0),
    }));
  };

  const clearWarehouseForm = () => {
    setWhCode(""); setWhName(""); setWhOpeningQty(""); setWhAddedQty(""); setWhAdjQty(""); setWhNotes(""); setWhSupplier(""); setWhCostPrice("");
    setWarehouseEditId(null); setWarehouseFormVisible(false);
  };

  const saveWarehouseItem = () => {
    if (!whCode.trim() || !whName.trim()) return;
    const code = whCode.trim().toUpperCase();
    const dup = warehouseItems.find(w => w.year === warehouseYear && w.code === code && w.id !== (warehouseEditId ?? -1));
    if (dup) { addToast(`קוד "${code}" כבר קיים בשנה זו`, "error"); return; }
    const item: WarehouseItem = {
      id: warehouseEditId ?? Date.now(),
      year: warehouseYear,
      code,
      name: whName.trim(),
      openingQty: Number(whOpeningQty) || 0,
      addedQty: Number(whAddedQty) || 0,
      adjustmentQty: Number(whAdjQty) || 0,
      notes: whNotes.trim() || undefined,
      supplier: whSupplier.trim() || undefined,
      costPrice: Number(whCostPrice) || undefined,
    };
    if (warehouseEditId != null) {
      setWarehouseItems(prev => prev.map(w => w.id === warehouseEditId ? item : w));
    } else {
      setWarehouseItems(prev => [...prev, item]);
    }
    clearWarehouseForm();
  };

  const startEditWarehouseItem = (item: WarehouseItem) => {
    setWhCode(item.code); setWhName(item.name);
    setWhOpeningQty(String(item.openingQty)); setWhAddedQty(String(item.addedQty));
    setWhAdjQty(String(item.adjustmentQty)); setWhNotes(item.notes ?? "");
    setWhSupplier(item.supplier ?? ""); setWhCostPrice(item.costPrice != null ? String(item.costPrice) : "");
    setWarehouseEditId(item.id); setWarehouseFormVisible(true);
  };

  const deleteWarehouseItemById = (id: number) => {
    showConfirm({
      title: "מחיקת מוצר מחסן",
      message: "למחוק מוצר מחסן זה?",
      confirmLabel: "מחק",
      confirmVariant: "danger",
      onConfirm: () => setWarehouseItems(prev => prev.filter(w => w.id !== id)),
    });
  };

  const updateInventoryWarehouseCode = (dayId: number, productId: number, code: string) => {
    setSaleDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      const base = getInventoryForDay(d);
      const updated = base.map(item =>
        item.productId === productId ? { ...item, warehouseCode: code || undefined } : item
      );
      return { ...d, inventory: updated };
    }));
  };

  const exportWarehouseToXlsx = (year: number) => {
    const summary = getWarehouseSummary(year);
    const wb = XLSX.utils.book_new();
    const sumRows = summary.map(r => ({
      "קוד מוצר": r.code, "שם מוצר": r.name, "שנה": r.year, "סטטוס": r.status,
      "יתרת פתיחה": r.openingQty, "כניסות": r.addedQty, "תיקון": r.adjustmentQty,
      "נדרש כולל": r.requiredTotal, "כמות לאריזה": r.plannedTotal, "נארז": r.packedTotal,
      "עוד לארוז": r.remainingToPackQty, "חזר": r.returnedTotal,
      "קיים כעת": r.currentQty, "חסר": r.shortageQty,
      "הערות": r.notes ?? "",
    }));
    const ws1 = XLSX.utils.json_to_sheet(sumRows);
    ws1["!cols"] = Array(15).fill({ wch: 16 });
    (ws1 as any)["!rtl"] = true;
    XLSX.utils.book_append_sheet(wb, ws1, "סיכום מחסן");

    const detRows = summary.flatMap(r => r.dayDetails.map(d => ({
      "קוד מוצר": r.code, "שם מחסן": r.name, "יום מכירה": d.dayName,
      "שם מוצר ביום": d.productName, "נדרש": d.requiredQty, "כמות לאריזה": d.plannedQty,
      "נארז": d.actualInQty, "נמכר": d.soldQty, "נשאר": d.remainingQty, "נספר בפועל": d.actualEndQty ?? "",
    })));
    const ws2 = XLSX.utils.json_to_sheet(detRows);
    ws2["!cols"] = Array(9).fill({ wch: 16 });
    (ws2 as any)["!rtl"] = true;
    XLSX.utils.book_append_sheet(wb, ws2, "פירוט לפי ימי מכירה");

    const rawRows = warehouseItems.filter(w => w.year === year).map(r => ({
      "קוד מוצר": r.code, "שם מוצר": r.name, "שנה": r.year,
      "יתרת פתיחה": r.openingQty, "כניסות": r.addedQty, "תיקון": r.adjustmentQty, "הערות": r.notes ?? "",
    }));
    const ws3 = XLSX.utils.json_to_sheet(rawRows);
    ws3["!cols"] = Array(7).fill({ wch: 16 });
    (ws3 as any)["!rtl"] = true;
    XLSX.utils.book_append_sheet(wb, ws3, "מוצרי מחסן");

    const n = new Date();
    const stamp = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    XLSX.writeFile(wb, `מחסן_${year}_${stamp}.xlsx`);
  };
  const addSeller = () => {
    if (!newSeller) {
      return;
    }

    setSellers((prev) => [
      ...prev,
      { name: newSeller, isAdmin: false },
    ]);

    setNewSeller("");
  };

  const startEditProduct = (
    product: Product
  ) => {
    setEditingProductId(product.id);
    setEditingName(product.name);
    setEditingPrice(String(product.price));
    setEditingCategory(product.category);
    setEditingPriceLevels((product.priceLevels ?? []).join(", "));
    setEditingGiftTrigger(product.giftTrigger ?? false);
    setEditingIsGiftBag(product.isGiftBag ?? false);
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditingName("");
    setEditingPrice("");
    setEditingCategory("");
    setEditingPriceLevels("");
    setEditingGiftTrigger(false);
    setEditingIsGiftBag(false);
  };

  const moveProduct = (productId: number, direction: "up" | "down") => {
    setActiveProducts(prev => {
      const idx = prev.findIndex(p => p.id === productId);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const saveEditedProduct = () => {
    if (
      editingProductId === null ||
      !editingName ||
      !editingPrice ||
      !editingCategory
    ) {
      return;
    }

    const parsedLevels = editingPriceLevels
      .split(/[,\s]+/)
      .map(s => Number(s.trim()))
      .filter(n => n > 0);
    setActiveProducts((prev) =>
      prev.map((product) =>
        product.id === editingProductId
          ? {
              ...product,
              name: editingName,
              price: Number(editingPrice),
              category: editingCategory,
              stock: product.stock,
              priceLevels: parsedLevels.length > 0 ? parsedLevels : undefined,
              giftTrigger: editingGiftTrigger || undefined,
              isGiftBag: editingIsGiftBag || undefined,
            }
          : product
      )
    );

    cancelEditProduct();
  };

  const startEditCustomer = (customer: Customer, idx: number) => {
    setEditingCustomerId(customer.id);
    setEditingCustomerIdx(idx);
    setEditingCustomerName(customer.name);
    setEditingCustomerPhone(customer.phone);
    setEditingCustomerIdNumber(customer.idNumber);
    setEditingCustomerType(customer.customerType);
  };

  const cancelEditCustomer = () => {
    setEditingCustomerId(null);
    setEditingCustomerIdx(null);
    setEditingCustomerName("");
    setEditingCustomerPhone("");
    setEditingCustomerIdNumber("");
    setEditingCustomerType("3");
  };

  const importCustomersForDay = async (e: React.ChangeEvent<HTMLInputElement>, dayId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    const importBase = Date.now();
    const importedCustomers = (jsonData as any[]).map((row, idx) => ({
      id: importBase * 10000 + idx,
      name: String(row["שם לקוח"] || row["שם"] || "").trim(),
      phone: String(row["טלפון"] || "").replace(".0", "").replace(/\D/g, ""),
      idNumber: String(row["תעודת זהות"] || "").replace(".0", "").replace(/\D/g, ""),
      customerType: String(row["סוג לקוח"] || "3") as CustomerType,
    }));
    setSaleDays(prev => prev.map(d => d.id === dayId ? { ...d, customers: importedCustomers } : d));
    e.target.value = "";
  };

  const addCustomerForDay = (dayId: number): Customer | null => {
    if (!newCustomerName || !newCustomerPhone) return null;
    const newCustomer: Customer = {
      id: Date.now(),
      name: newCustomerName,
      phone: newCustomerPhone,
      idNumber: newCustomerIdNumber,
      customerType: newCustomerType,
    };
    setSaleDays(prev => prev.map(d => d.id === dayId ? { ...d, customers: [...(d.customers ?? []), newCustomer] } : d));
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerIdNumber("");
    setNewCustomerType("3");
    return newCustomer;
  };

  const deleteCustomerForDay = (customerId: number, dayId: number) => {
    const day = saleDays.find(d => d.id === dayId);
    const customer = (day?.customers ?? []).find(c => c.id === customerId);
    showConfirm({
      title: "מחיקת לקוח",
      message: "למחוק לקוח זה מהמכירה?",
      itemName: customer?.name ?? String(customerId),
      confirmLabel: "מחק",
      confirmVariant: "danger",
      onConfirm: () => setSaleDays(prev => prev.map(d => d.id === dayId ? { ...d, customers: (d.customers ?? []).filter(c => c.id !== customerId) } : d)),
    });
  };

  const saveEditedCustomerForDay = (dayId: number) => {
    if (editingCustomerId === null || !editingCustomerName || !editingCustomerPhone) return;
    setSaleDays(prev => prev.map(d => d.id === dayId ? {
      ...d, customers: (d.customers ?? []).map(c => c.id === editingCustomerId ? {
        ...c, name: editingCustomerName, phone: editingCustomerPhone, idNumber: editingCustomerIdNumber, customerType: editingCustomerType,
      } : c)
    } : d));
    cancelEditCustomer();
  };

  const deleteAllCustomersForDay = (dayId: number) => {
    setSaleDays(prev => prev.map(d => d.id === dayId ? { ...d, customers: [] } : d));
  };

  const getCustomerHistoryForDay = (customerId: number, dayId: number): Transaction[] => {
    const day = saleDays.find(d => d.id === dayId);
    if (!day) return [];
    const customer = (day.customers ?? []).find(c => c.id === customerId);
    if (!customer) return [];
    const normalize = (s?: string | number) => String(s || "").replace(/\D/g, "");
    return (day.transactions ?? []).filter(t => {
      if (typeof t.customerId !== "undefined" && t.customerId === customer.id) return true;
      if (normalize(t.customerPhone) === normalize(customer.phone) || t.customerName === customer.name) return true;
      return false;
    });
  };

  const clearCart = () => {
    setCart([]);
    setActivePreOrderRef(null);
    setManualDiscountAmount("");
  };

  const getDailySalesReport = () => {
    return activeTransactions.reduce(
      (acc: Record<string, number>, transaction) => {
        const date = transaction.dateISO
          ? new Date(transaction.dateISO)
          : new Date(transaction.date);
        const key = date.toLocaleDateString("en-GB");
        acc[key] =
          (acc[key] || 0) + transaction.finalTotal;
        return acc;
      },
      {}
    );
  };

  const getMonthlySalesReport = () => {
    return activeTransactions.reduce(
      (acc: Record<string, number>, transaction) => {
        const date = transaction.dateISO
          ? new Date(transaction.dateISO)
          : new Date(transaction.date);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[key] =
          (acc[key] || 0) + transaction.finalTotal;
        return acc;
      },
      {}
    );
  };

  const getCategorySalesReport = () => {
    return activeTransactions.reduce(
      (acc: Record<string, number>, transaction) => {
        const grossTotal = transaction.items.reduce((s, i) => s + i.price * i.qty, 0);
        if (grossTotal === 0) return acc;
        const ratio = transaction.finalTotal / grossTotal;
        transaction.items.forEach((item) => {
          const product = activeProducts.find((p) => p.id === item.id);
          const category = product?.category || "לא ידוע";
          acc[category] = (acc[category] || 0) + item.price * item.qty * ratio;
        });
        return acc;
      },
      {}
    );
  };

  const getCustomerSalesReport = () => {
    return activeTransactions.reduce(
      (acc: Record<string, number>, transaction) => {
        acc[transaction.customerName] =
          (acc[transaction.customerName] || 0) +
          transaction.finalTotal;
        return acc;
      },
      {}
    );
  };

  const getSellerSalesReport = () => {
    return activeTransactions.reduce(
      (acc: Record<string, number>, transaction) => {
        acc[transaction.seller] =
          (acc[transaction.seller] || 0) +
          transaction.finalTotal;
        return acc;
      },
      {}
    );
  };



  const inputStyle = {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
  };

  return (
    <ErrorBoundary>
      <div
        style={{
          minHeight: "100vh",
          background: "#f1f5f9",
          direction: "rtl",
          fontFamily: "Arial",
        }}
      >
        {/* ── ניווט קופה (מצב מוכר) ── */}
        {cashierMode && (
          <div style={{ background: "#083f1e", display: "flex", alignItems: "center", padding: "0 16px", height: "52px", gap: "12px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 1000 }}>
            <span style={{ fontWeight: 800, fontSize: "16px", color: "white" }}>{activeSaleDay?.name ?? "קופה"}</span>
            {activeSaleDay && (
              <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: "8px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>
                {activeSaleDay.type === "walkin" ? "עם הנחה" : activeSaleDay.type === "walkin-nodiscount" ? "ללא הנחה" : activeSaleDay.type === "preorder" ? `הזמנות | ממתינות: ${activeSaleDay.preOrders.filter(o => o.status === "pending").length}` : "פתוח"}
              </span>
            )}
            <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginRight: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
              מוכר:&nbsp;
              <select value={currentSeller} onChange={e => setCurrentSeller(e.target.value)} style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "13px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "white" }}>
                {sellers.map(s => <option key={s.name} value={s.name} style={{ background: "#083f1e" }}>{s.name}</option>)}
              </select>
            </label>
            <button onClick={() => setCashierMode(false)} className="cc-btn" style={navActionBtn()}>
              ← יציאה מהקופה
            </button>
            <button onClick={toggleFullscreen} title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"} className="cc-btn" style={navIconBtn()}>
              {isFullscreen ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>}
            </button>
          </div>
        )}

        {/* ── ניווט ניהול (מצב מנהל) ── */}
        {!cashierMode && (
          <div style={{ background: "#083f1e", display: "flex", alignItems: "stretch", position: "sticky", top: 0, zIndex: 1000, borderBottom: "3px solid #248f4b", paddingRight: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
            {([ ["home","ראשי"], ["sales","מכירות"], ["inventory","מלאי ומחסן"], ["reports","דוחות"], ["settings","הגדרות"] ] as const).map(([key, label]) => (
              <button key={key} onClick={() => setAdminTab(key as typeof adminTab)} className="cc-nav-tab"
                style={navTabBtn(adminTab === key)}>
                {label}
              </button>
            ))}
            <div style={{ marginRight: "auto", display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px" }}>
              <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "6px" }}>
                מוכר:&nbsp;
                <select value={currentSeller} onChange={e => setCurrentSeller(e.target.value)} style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "13px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "white" }}>
                  {sellers.map(s => <option key={s.name} value={s.name} style={{ background: "#083f1e" }}>{s.name}</option>)}
                </select>
              </label>
              <button onClick={() => setCashierMode(true)} disabled={!activeSaleDay}
                className="cc-btn" style={btn("primary", "sm")}>
                🖥 כניסה לקופה
              </button>
              <button onClick={toggleFullscreen} title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"} className="cc-btn" style={navIconBtn()}>
                {isFullscreen ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>}
              </button>
            </div>
          </div>
        )}


        <div className={!cashierMode && adminTab === "sales" ? "sales-content-wrap" : !cashierMode && adminTab === "inventory" ? "sales-content-wrap" : undefined} style={{ padding: cashierMode ? "0" : "20px" }}>
          {cashierMode && !activeSaleDay && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
              <div style={{ fontSize: "64px" }}>🔒</div>
              <h2 style={{ margin: 0, fontSize: "24px", color: "#374151" }}>אין כרגע מכירה פעילה</h2>
              <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>יש לפנות למנהל להפעיל יום מכירה</p>
              <button onClick={() => setCashierMode(false)} className="cc-btn" style={btn("primary", "lg")}>← חזרה לניהול</button>
            </div>
          )}
          {cashierMode && activeSaleDay && (
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px", alignItems: "start", padding: "20px" }}>

            {/* ── פאנל שמאל: מוצרים ולקוח ── */}
            <div style={{ background: "white", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "0", height: "calc(100vh - 92px)", overflow: "hidden", position: "sticky", top: "52px" }}>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "10px" }}>

              {/* חיפוש לקוח */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  placeholder={activeSaleDay?.type === "preorder" ? "חיפוש הזמנה (שם / טלפון)" : "חיפוש לקוח (שם / טלפון)"}
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                />
                {(customerResults.length > 0 || preOrderSearchResults.length > 0) && (
                  <div style={{ position: "absolute", top: "100%", right: 0, left: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", zIndex: 100, maxHeight: "240px", overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                    {customerResults.map((c, _ci) => (
                      <div key={`${c.id}-${_ci}`} onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: "#6b7280", fontSize: "13px" }}>{c.phone}</span>
                      </div>
                    ))}
                    {preOrderSearchResults.map((order, _oi) => (
                      <div key={`${order.id}-${_oi}`} onClick={() => { loadPreOrderToCart(order, activeSaleDay!.id, order.id); setCustomerSearch(""); }}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", background: "#f0fdf4" }}>
                        <div style={{ fontWeight: 600 }}>{order.customerName}{order.customerPhone ? ` | ${order.customerPhone}` : ""}</div>
                        {order.notes && <div style={{ fontSize: "12px", color: "#059669" }}>{order.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {activeSaleDay && (
                <button
                  onClick={() => setShowNewCustomerModalDayId(activeSaleDay.id)}
                  className="cc-btn" style={btn("primary", "sm")}
                >
                  + לקוח
                </button>
              )}
              </div>

              {/* לקוח נבחר */}
              {selectedCustomer && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "8px 14px" }}>
                  <span style={{ fontWeight: 600, flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {selectedCustomer.name}
                  </span>
                  {discountPercent > 0 && <span style={{ background: "#2563eb", color: "white", borderRadius: "8px", padding: "2px 8px", fontSize: "13px" }}>הנחה {discountPercent}%</span>}
                </div>
              )}

              {/* קטגוריות */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => { setSelectedCategory(cat); setProductSearch(""); }}
                    className="cc-btn" style={btn(selectedCategory === cat ? "primary" : "secondary")}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* גריד מוצרים */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                {filteredProducts.map(product => (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className="cc-btn cc-product-tile" style={productTileBtn()}
                  >
                    <span style={{ fontSize: "15px" }}>{product.name}</span>
                    {(!isOpenMode || product.price > 0) && <span style={{ color: "#2563eb", fontSize: "16px" }}>₪{getEffectivePrice(product.price)}</span>}
                    {(() => {
                      const info = getCashierProductRemaining(product.id);
                      if (!info) return null;
                      const { remaining, reserved, available } = info;
                      if (reserved !== null && available !== null) {
                        // ביום הזמנות: הצג מוזמן + פנוי
                        return (
                          <span style={{ display: "flex", flexDirection: "column", gap: "1px", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: reserved > 0 ? "#7c3aed" : "#6b7280" }}>
                              מוזמן: {reserved}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: available > 10 ? "#16a34a" : available > 0 ? "#f59e0b" : "#dc2626" }}>
                              פנוי: {available}
                            </span>
                          </span>
                        );
                      }
                      // יום רגיל: הצג מלאי
                      return (
                        <span style={{ fontSize: "11px", fontWeight: 600, color: remaining >= 30 ? "#16a34a" : remaining >= 10 ? "#f59e0b" : "#dc2626" }}>
                          מלאי: {remaining}
                        </span>
                      );
                    })()}
                  </button>
                ))}
              </div>
              </div>

              {/* כפתורי פעולה */}
              <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "12px", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={savePendingSale} className="cc-btn" style={{ ...btn("warning", "lg"), flex: 1 }}>
                    ⏸ שמירה
                  </button>
                  <div style={{ position: "relative", flex: 1 }}>
                    <button onClick={() => setShowMoreActions(v => !v)} className="cc-btn" style={{ ...menuTriggerBtn(), width: "100%" }}>
                      ↩ פעולות נוספות
                    </button>
                    {showMoreActions && (
                      <div style={{ position: "absolute", bottom: "110%", right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 200, minWidth: "180px", overflow: "hidden" }}>
                        <button onClick={() => { setShowReturnModal(true); setReturnSearch(""); setReturnSourceId(null); setReturnQtys({}); setShowMoreActions(false); }}
                          className="cc-menu-item" style={menuItemBtn("purple")}>
                          ↩ החזרת מוצר
                        </button>
                        <button onClick={() => {
                          if (activeSaleDay) {
                            const inv = getInventoryForDay(activeSaleDay);
                            const initial: Record<number, number> = {};
                            inv.forEach(i => { initial[i.productId] = i.actualEndQty ?? 0; });
                            setCloseDayActuals(initial);
                          }
                          setShowCloseDayModal(true);
                          setShowMoreActions(false);
                        }}
                          className="cc-menu-item danger" style={{ ...menuItemBtn("danger"), borderTop: "1px solid #f1f5f9" }}>
                          🔒 סגירת יום מכירה
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { if (cart.length > 0) { setShowPaymentModal(true); setPaymentModalError(""); } }} disabled={cart.length === 0}
                    className="cc-btn" style={{ ...btn("primary", "lg"), flex: 2, padding: "13px" }}>
                    💳 מעבר לתשלום
                  </button>
                </div>
              </div>
            </div>

            {/* ── פאנל ימין: סל ── */}
            <div style={{ background: "white", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "0", height: "calc(100vh - 92px)", overflow: "hidden", position: "sticky", top: "52px" }}>

              {/* כותרת סל */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  סל קניות
                </h2>
                {cart.length > 0 && <span style={{ background: "#2563eb", color: "white", borderRadius: "20px", padding: "2px 10px", fontSize: "13px", fontWeight: 700 }}>{cart.length}</span>}
                <button onClick={clearCart} className="cc-btn" style={{ ...btn("dangerGhost", "sm"), marginRight: "auto" }}>
                  נקה סל
                </button>
              </div>

              {/* פריטים בסל */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {cart.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", paddingTop: "40px" }}>הסל ריק</div>}
                {cart.map(item => (
                  <div key={`${item.id}-${item.price}`} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.name}</span>
                      {isOpenMode && <span style={{ display: "block", fontSize: "12px", color: "#6b7280" }}>₪{item.price} ליח׳</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => decreaseQty(item.id, isOpenMode ? item.price : undefined)} className="cc-btn" style={btn("danger", "sm")}>−</button>
                      <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => increaseQty(item.id, isOpenMode ? item.price : undefined)} className="cc-btn" style={btn("primary", "sm")}>+</button>
                    </div>
                    <span style={{ minWidth: "60px", textAlign: "left", color: "#2563eb", fontWeight: 700, fontSize: "14px" }}>₪{(item.price * item.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* סיכום */}
              <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "10px", marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", color: "#6b7280", marginBottom: "3px" }}>
                  <span>סכום</span>
                  {isOpenMode ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>₪{total}</span>
                      <span style={{ color: "#374151", fontWeight: 600, fontSize: "13px" }}>הנחה:</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={manualDiscountAmount}
                        onChange={e => setManualDiscountAmount(e.target.value)}
                        style={{ ...inputStyle, width: "70px", padding: "2px 6px", fontSize: "13px" }}
                      />
                    </div>
                  ) : (
                    <span>₪{total}</span>
                  )}
                </div>
                {giftFreeQty > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#7c3aed", fontWeight: 700, marginBottom: "3px" }}>
                    <span>🎁 {giftBagProduct?.name} ×{giftFreeQty} (מתנה)</span>
                    {giftBagDiscount > 0 && <span>−₪{giftBagDiscount}</span>}
                  </div>
                )}
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", color: "#16a34a", fontWeight: 700, marginBottom: "3px" }}>
                    <span>הנחה</span><span>−₪{discountAmount}</span>
                  </div>
                )}
                {paymentMethod === "cash" && roundingDiff !== 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", marginBottom: "3px" }}>
                    <span>עיגול</span><span>{roundingDiff > 0 ? "+" : ""}₪{roundingDiff.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #e2e8f0", paddingTop: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}>לתשלום</span>
                  <span style={{ fontSize: "28px", fontWeight: 800, color: "#1e3a8a" }}>₪{effectiveFinalTotal}</span>
                </div>
              </div>

              {/* עסקאות בהמתנה — מסוננות ליום הפעיל */}
              {(() => {
                const visiblePending = activeSaleDay
                  ? pendingSales.filter(s => s.saleDayId === activeSaleDay.id)
                  : [];
                return visiblePending.length > 0 ? (
                  <div style={{ borderTop: "2px solid #f1f5f9", marginTop: "10px", paddingTop: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", marginBottom: "6px" }}>⏸ בהמתנה ({visiblePending.length})</div>
                    <div style={{ maxHeight: "140px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {visiblePending.map((sale) => (
                        <div key={sale.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef3c7", borderRadius: "8px", padding: "6px 10px", fontSize: "13px" }}>
                          <span style={{ fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sale.customerName || "ללא שם"}</span>
                          <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>₪{sale.finalTotal}</span>
                          <button onClick={() => resumePendingSale(sale)} className="cc-btn" style={btn("primary", "sm")}>חזור</button>
                          <button onClick={() => deletePendingSale(sale.id)} className="cc-btn" style={btn("danger", "sm")}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

          </div>
          )}

          {/* ═══════════════════════════════════════════════════
              מסך ראשי
          ═══════════════════════════════════════════════════ */}
          {!cashierMode && adminTab === "home" && (() => {
            const homeFiltered = saleDays.filter(day => {
              const q = homeSearch.trim().toLowerCase();
              if (q && !day.name.toLowerCase().includes(q) && !day.date.includes(q)) return false;
              if (homeTypeFilter && day.type !== homeTypeFilter) return false;
              return true;
            }).sort((a, b) => {
              if (!a.date && !b.date) return 0;
              if (!a.date) return 1;
              if (!b.date) return -1;
              return b.date.localeCompare(a.date);
            });
            return (
              <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* ── כרטיס מכירה פעילה (קומפקטי) ── */}
                {activeSaleDay ? (
                  <div style={{ background: "white", borderRadius: "16px", padding: "18px 24px", border: "2px solid #86efac" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", direction: "rtl" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>פעיל</span>
                        <span style={{ fontWeight: 800, fontSize: "17px" }}>{activeSaleDay.name}</span>
                        <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>{typeLabel(activeSaleDay.type)}</span>
                        {activeSaleDay.date && <span style={{ fontSize: "13px", color: "#6b7280" }}>{formatDateIL(activeSaleDay.date)}</span>}
                        <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: 700 }}>{formatTransactionCount(activeTransactions.filter(t => !t.isReturn).length)}</span>
                        <span style={{ fontSize: "13px", color: "#15803d", fontWeight: 700 }}>{formatCurrency(activeTransactions.reduce((s, t) => s + t.finalTotal, 0))} נטו</span>
                        {pendingSales.filter(s => s.saleDayId === activeSaleDay.id).length > 0 && (
                          <span style={{ fontSize: "12px", color: "#92400e", background: "#fef3c7", borderRadius: "6px", padding: "2px 8px", fontWeight: 700 }}>{pendingSales.filter(s => s.saleDayId === activeSaleDay.id).length} בהמתנה</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => setCashierMode(true)} className="cc-btn" style={btn("primary")}>כניסה לקופה</button>
                        <button onClick={() => { setAdminTab("sales"); setSaleDayDetailId(activeSaleDay.id); setSaleDayDetailTab("info"); }} className="cc-btn" style={btn("ghost")}>ניהול</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "12px", padding: "14px 20px", color: "#92400e", fontSize: "14px", fontWeight: 600, direction: "rtl" }}>
                    אין יום מכירה פעיל — הפעל יום מכירה מהטבלה למטה
                  </div>
                )}

                {/* ── טבלת כל ימי המכירה ── */}
                <div style={{ background: "white", borderRadius: "16px", padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px", direction: "rtl" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#374151" }}>כל ימי המכירה ({saleDays.length})</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <input placeholder="חיפוש לפי שם או תאריך..." value={homeSearch} onChange={e => setHomeSearch(e.target.value)}
                        style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", minWidth: "180px", direction: "rtl" }} />
                      <select value={homeTypeFilter} onChange={e => setHomeTypeFilter(e.target.value as typeof homeTypeFilter)}
                        style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", direction: "rtl" }}>
                        <option value="">כל הסוגים</option>
                        <option value="walkin">עם הנחה</option>
                        <option value="walkin-nodiscount">ללא הנחה</option>
                        <option value="preorder">הזמנות</option>
                        <option value="open">פתוח</option>
                      </select>
                      <button onClick={() => setAdminTab("sales")} className="cc-btn" style={btn("primary", "sm")}>+ יום מכירה חדש</button>
                    </div>
                  </div>
                  {homeFiltered.length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: "14px", textAlign: "center", padding: "32px" }}>אין ימי מכירה תואמים</div>
                  ) : (
                    <>
                      {/* desktop table */}
                      <div className="home-table-wrap" style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", direction: "rtl" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>שם המכירה</th>
                              <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>תאריך</th>
                              <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>סוג</th>
                              <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>מצב</th>
                              <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>עסקאות</th>
                              <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>סכום נטו</th>
                              <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>פעולות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {homeFiltered.map(day => {
                              const dayTxs = day.transactions ?? [];
                              const dayTotal = dayTxs.reduce((s, t) => s + t.finalTotal, 0);
                              const daySales = dayTxs.filter(t => !t.isReturn).length;
                              return (
                                <tr key={day.id} style={{ borderBottom: "1px solid #f1f5f9", background: day.isActive ? "#f0fdf4" : "white" }}>
                                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>{day.name}</td>
                                  <td style={{ padding: "10px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDateIL(day.date)}</td>
                                  <td style={{ padding: "10px 14px" }}>
                                    <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: 600 }}>{typeLabel(day.type)}</span>
                                  </td>
                                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                    {day.isActive
                                      ? <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: "6px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>פעיל</span>
                                      : <span style={{ background: "#f1f5f9", color: "#6b7280", borderRadius: "6px", padding: "2px 10px", fontSize: "12px", fontWeight: 600 }}>לא פעיל</span>}
                                  </td>
                                  <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>{formatTransactionCount(daySales)}</td>
                                  <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#1e40af" }}>{formatCurrency(dayTotal)}</td>
                                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                      <button onClick={() => { setAdminTab("sales"); setSaleDayDetailId(day.id); setSaleDayDetailTab("info"); }}
                                        className="cc-btn" style={btn("ghost", "sm")}>פרטים</button>
                                      <button onClick={() => handleActivateSaleDay(day.id)}
                                        className="cc-btn" style={btn(day.isActive ? "warning" : "success", "sm")}>
                                        {day.isActive ? "השהה" : "הפעל"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* mobile cards */}
                      <div className="home-cards" style={{ display: "none" }}>
                        {homeFiltered.map(day => {
                          const dayTxs = day.transactions ?? [];
                          const dayTotal = dayTxs.reduce((s, t) => s + t.finalTotal, 0);
                          const daySales = dayTxs.filter(t => !t.isReturn).length;
                          return (
                            <div key={day.id} style={{ background: day.isActive ? "#f0fdf4" : "#fafafa", border: `1px solid ${day.isActive ? "#86efac" : "#e2e8f0"}`, borderRadius: "12px", padding: "14px 16px", direction: "rtl" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
                                {day.isActive && <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>פעיל</span>}
                                <span style={{ fontWeight: 700, fontSize: "15px" }}>{day.name}</span>
                                <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: 600 }}>{typeLabel(day.type)}</span>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                                <span>{formatDateIL(day.date)}</span>
                                <span>{formatTransactionCount(daySales)}</span>
                                <span style={{ fontWeight: 700, color: "#1e40af" }}>{formatCurrency(dayTotal)}</span>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => { setAdminTab("sales"); setSaleDayDetailId(day.id); setSaleDayDetailTab("info"); }}
                                  className="cc-btn" style={btn("ghost", "sm")}>פרטים</button>
                                <button onClick={() => handleActivateSaleDay(day.id)}
                                  className="cc-btn" style={btn(day.isActive ? "warning" : "success", "sm")}>
                                  {day.isActive ? "השהה" : "הפעל"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════
              מסך מכירות מאוחד
          ═══════════════════════════════════════════════════ */}
          {!cashierMode && adminTab === "sales" && (() => {
            const effectiveDayId = saleDayDetailId ?? activeSaleDay?.id ?? (saleDays.length > 0 ? saleDays[0].id : null);
            const detailDay = effectiveDayId !== null ? (saleDays.find(d => d.id === effectiveDayId) ?? null) : null;
            const PAGE_SIZE = 50;
            const typeLabel2 = (t: string) =>
              t === "walkin" ? "עם הנחה" : t === "walkin-nodiscount" ? "ללא הנחה" : t === "preorder" ? "הזמנות" : "פתוח";
            const thS: React.CSSProperties = {
              padding: "9px 12px", textAlign: "center" as const, fontWeight: 700, color: "#374151",
              fontSize: "13px", whiteSpace: "nowrap" as const, background: "#f8fafc",
              position: "sticky" as const, top: 0, zIndex: 1, borderBottom: "2px solid #e2e8f0",
            };
            const tdS: React.CSSProperties = {
              padding: "9px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" as const,
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", minHeight: 0 }}>
                {/* כותרת */}
                <div style={{ background: "white", borderRadius: "16px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", direction: "rtl", flexShrink: 0, overflow: "visible" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#374151", fontWeight: 700, whiteSpace: "nowrap" }}>ניהול מכירה</h3>
                  <select
                    value={effectiveDayId ?? ""}
                    onChange={e => { setSaleDayDetailId(Number(e.target.value) || null); setSaleDayDetailTab("info"); }}
                    style={{ padding: "7px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", minWidth: "220px" }}>
                    {saleDays.length === 0 && <option value="">אין ימי מכירה</option>}
                    {saleDays.map(d => (
                      <option key={d.id} value={d.id}>{d.name}{d.date ? ` (${formatDateIL(d.date)})` : ""}{d.isActive ? " ✓" : ""}</option>
                    ))}
                  </select>
                  {detailDay && (
                    <>
                      <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: "8px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>{typeLabel2(detailDay.type)}</span>
                      {detailDay.isActive
                        ? <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: "8px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>פעיל</span>
                        : <span style={{ background: "#f1f5f9", color: "#6b7280", borderRadius: "8px", padding: "2px 10px", fontSize: "12px", fontWeight: 600 }}>לא פעיל</span>}
                    </>
                  )}
                  <div style={{ marginRight: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => setShowNewSaleDayForm(v => !v)}
                      className="cc-btn" style={btn(showNewSaleDayForm ? "secondary" : "primary", "sm")}>
                      {showNewSaleDayForm ? "✕ סגור" : "+ מכירה חדשה"}
                    </button>
                    {detailDay && (
                      <button onClick={() => handleActivateSaleDay(detailDay.id)}
                        className="cc-btn" style={btn(detailDay.isActive ? "warning" : "success", "sm")}>
                        {detailDay.isActive ? "השהה" : "הפעל"}
                      </button>
                    )}
                    {detailDay && (
                      <div style={{ position: "relative" }}>
                        <button onClick={() => setShowSaleActionsMenu(v => !v)}
                          className="cc-btn" style={btn("ghost", "sm")}>⋯ פעולות</button>
                        {showSaleActionsMenu && (
                          <div style={{ position: "absolute", top: "110%", left: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 300, minWidth: "180px", overflow: "hidden" }}
                            onMouseLeave={() => setShowSaleActionsMenu(false)}>
                            {detailDay.isActive && (
                              <button onClick={() => { setCashierMode(true); setShowSaleActionsMenu(false); }}
                                className="cc-menu-item" style={menuItemBtn("primary")}>🏪 כניסה לקופה</button>
                            )}
                            <button onClick={() => { setAdminTab("inventory"); setInventoryAdminTab("inventory"); setInventorySelectedDayId(detailDay.id); setInventoryStep("planning"); setShowSaleActionsMenu(false); }}
                              className="cc-menu-item" style={menuItemBtn()}>📦 פתח במלאי</button>
                            <div style={{ height: "1px", background: "#f1f5f9", margin: "2px 0" }} />
                            <button onClick={() => { exportSaleDayData(detailDay.id); setShowSaleActionsMenu(false); }}
                              className="cc-menu-item" style={menuItemBtn("primary")}>↓ ייצוא JSON</button>
                            <label className="cc-menu-item" style={{ ...menuItemBtn("purple"), display: "flex", alignItems: "center", cursor: "pointer" }}>
                              ↑ ייבוא JSON
                              <input ref={saleDayImportRef} type="file" accept=".json" style={{ display: "none" }}
                                onChange={e => { importSaleDayData(e); setShowSaleActionsMenu(false); }} />
                            </label>
                            <div style={{ height: "1px", background: "#f1f5f9", margin: "2px 0" }} />
                            <button onClick={() => { deleteSaleDay(detailDay.id); setShowSaleActionsMenu(false); }}
                              className="cc-menu-item danger" style={menuItemBtn("danger")}>🗑 מחק יום מכירה</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* טופס יצירת יום מכירה */}
                {showNewSaleDayForm && (
                  <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <input placeholder="שם מכירה" value={newSaleDayName} onChange={e => setNewSaleDayName(e.target.value)} style={{ ...inputStyle, flex: "1 1 160px" }} />
                      <input type="date" value={newSaleDayDate} onChange={e => setNewSaleDayDate(e.target.value)} style={{ ...inputStyle, flex: "0 0 160px" }} />
                      <select value={newSaleDayType} onChange={e => setNewSaleDayType(e.target.value as SaleDayType)} style={{ ...inputStyle, flex: "0 0 200px" }}>
                        <option value="walkin">לקוחות עם הנחה</option>
                        <option value="walkin-nodiscount">לקוחות ללא הנחה</option>
                        <option value="preorder">הזמנות</option>
                        <option value="open">מכירה פתוחה</option>
                      </select>
                      <button onClick={() => { addSaleDay(); setShowNewSaleDayForm(false); }} className="cc-btn" style={btn("primary")}>צור יום מכירה</button>
                    </div>
                  </div>
                )}

                {saleDays.length === 0 && (
                  <div style={{ background: "white", borderRadius: "20px", padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                    <h2 style={{ margin: "0 0 8px" }}>אין ימי מכירה</h2>
                    <p style={{ color: "#6b7280" }}>לחץ "+ מכירה חדשה" כדי להתחיל</p>
                  </div>
                )}

                {detailDay && (
                  <div style={{ background: "white", borderRadius: "20px", display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0, overflow: "hidden" }}>
                    {/* לשוניות */}
                    <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", padding: "4px", flexShrink: 0, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                      {(["info","products","customers","transactions","summary"] as const).map(k => {
                        const tabLabels: Record<string, string> = {
                          info: "סקירה", products: "מוצרים",
                          customers: detailDay.type === "preorder" ? "הזמנות" : "לקוחות",
                          transactions: "עסקאות", summary: "סיכום",
                        };
                        return (
                          <button key={k} onClick={() => setSaleDayDetailTab(k)}
                            className="cc-tab" style={tabBtn(saleDayDetailTab === k)}>
                            {tabLabels[k]}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      {/* ══ סקירה ══ */}
                      {saleDayDetailTab === "info" && (() => {
                        const txs = detailDay.transactions ?? [];
                        const sales = txs.filter(t => !t.isReturn);
                        const returns = txs.filter(t => t.isReturn);
                        const grossTotal = sales.reduce((s, t) => s + t.finalTotal, 0);
                        const returnTotal = returns.reduce((s, t) => s + t.finalTotal, 0);
                        const netTotal = grossTotal + returnTotal;
                        const listCount = detailDay.type === "preorder"
                          ? (detailDay.preOrders ?? []).length
                          : (detailDay.customers ?? []).length;
                        const statItems: { label: string; value: string; color?: string }[] = [
                          { label: "שם", value: detailDay.name },
                          { label: "תאריך", value: formatDateIL(detailDay.date) },
                          { label: "סוג", value: typeLabel2(detailDay.type) },
                          { label: "מצב", value: detailDay.isActive ? "פעיל" : "לא פעיל", color: detailDay.isActive ? "#15803d" : "#6b7280" },
                          { label: "עסקאות", value: formatTransactionCount(sales.length), color: "#1e40af" },
                          { label: "מכירות ברוטו", value: formatCurrency(grossTotal), color: "#15803d" },
                          ...(returns.length > 0 ? [{ label: "החזרות", value: `${returns.length} — ${formatCurrency(Math.abs(returnTotal))}`, color: "#dc2626" }] : []),
                          { label: "נטו", value: formatCurrency(netTotal), color: "#1e40af" },
                          { label: detailDay.type === "preorder" ? "הזמנות" : "לקוחות", value: `${listCount}` },
                        ];
                        return (
                          <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                              {statItems.map(c => (
                                <div key={c.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase" as const }}>{c.label}</div>
                                  <div style={{ fontSize: "16px", fontWeight: 700, color: c.color ?? "#374151" }}>{c.value}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button onClick={() => setCashierMode(true)} className="cc-btn" style={btn("primary")}>🏪 כניסה לקופה</button>
                              <button onClick={() => handleActivateSaleDay(detailDay.id)} className="cc-btn" style={btn(detailDay.isActive ? "warning" : "success")}>
                                {detailDay.isActive ? "⏸ השהה מכירה" : "▶ הפעל מכירה"}
                              </button>
                              <button onClick={() => { setAdminTab("inventory"); setInventoryAdminTab("inventory"); setInventorySelectedDayId(detailDay.id); setInventoryStep("planning"); }} className="cc-btn" style={btn("secondary")}>
                                📦 פתח במלאי
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ══ מוצרים ══ */}
                      {saleDayDetailTab === "products" && (() => {
                        const detailProducts = detailDay.products ?? [];
                        const setDetailProducts = (updater: Product[] | ((prev: Product[]) => Product[])) => {
                          setSaleDays(prev => prev.map(d => {
                            if (d.id !== effectiveDayId) return d;
                            const cur = d.products ?? [];
                            const next = typeof updater === "function" ? updater(cur) : updater;
                            return { ...d, products: next };
                          }));
                        };
                        const cats = Array.from(new Set(detailProducts.map(p => p.category).filter(Boolean)));
                        const filtered = detailProducts.filter(p =>
                          (!productsSearch || p.name.toLowerCase().includes(productsSearch.toLowerCase()) || p.category.toLowerCase().includes(productsSearch.toLowerCase())) &&
                          (!productsCategoryFilter || p.category === productsCategoryFilter)
                        );
                        return (
                          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            {/* toolbar */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, direction: "rtl" }}>
                              <button onClick={() => setShowNewProductForm(v => !v)} className="cc-btn" style={btn("success", "sm")}>
                                {showNewProductForm ? "✕ סגור" : "+ מוצר חדש"}
                              </button>
                              <input placeholder="חיפוש..." value={productsSearch} onChange={e => setProductsSearch(e.target.value)}
                                style={{ ...inputStyle, flex: "1 1 140px", padding: "6px 10px", fontSize: "13px" }} />
                              {cats.length > 0 && (
                                <select value={productsCategoryFilter} onChange={e => setProductsCategoryFilter(e.target.value)}
                                  style={{ ...inputStyle, fontSize: "13px", padding: "6px 10px" }}>
                                  <option value="">כל הקטגוריות</option>
                                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}
                              <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>{filtered.length} מוצרים</span>
                            </div>
                            {/* new product form */}
                            {showNewProductForm && (
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", background: "#f8fafc", padding: "12px 14px", borderBottom: "1px solid #e2e8f0", direction: "rtl" }}>
                                <input placeholder="שם מוצר" value={newName} onChange={e => setNewName(e.target.value)} style={inputStyle} />
                                <input type="number" placeholder="מחיר" value={newPrice} onChange={e => setNewPrice(e.target.value)} style={inputStyle} />
                                <input placeholder="קטגוריה" value={newCategory} onChange={e => setNewCategory(e.target.value)} style={inputStyle} />
                                <input placeholder="רמות מחיר: 5, 10, 15" value={newPriceLevels} onChange={e => setNewPriceLevels(e.target.value)} style={inputStyle} />
                                <button onClick={() => setNewGiftTrigger(v => !v)} className="cc-btn" style={toggleBtn(newGiftTrigger)}>🎁 מוצר מזכה</button>
                                <button onClick={() => setNewIsGiftBag(v => !v)} className="cc-btn" style={toggleBtn(newIsGiftBag)}>👜 שקית יוקרתית</button>
                                <button onClick={() => {
                                  if (!newName || !newCategory) return;
                                  const parsedLevels = newPriceLevels.split(/[,\s]+/).map(s => Number(s.trim())).filter(n => n > 0);
                                  setDetailProducts(prev => [...prev, {
                                    id: Date.now(), name: newName, price: Number(newPrice), category: newCategory, stock: 0,
                                    ...(parsedLevels.length > 0 ? { priceLevels: parsedLevels } : {}),
                                    ...(newGiftTrigger ? { giftTrigger: true as const } : {}),
                                    ...(newIsGiftBag ? { isGiftBag: true as const } : {}),
                                  }]);
                                  setNewName(""); setNewPrice(""); setNewCategory(""); setNewPriceLevels("");
                                  setNewGiftTrigger(false); setNewIsGiftBag(false);
                                  setShowNewProductForm(false);
                                }} className="cc-btn" style={btn("primary")}>הוסף</button>
                              </div>
                            )}

                            {/* scroll area */}
                            <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                            {/* desktop table */}
                            <div className="sales-tbl">
                              <table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl" }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...thS, width: "36px", textAlign: "center" as const }}>#</th>
                                    <th style={thS}>שם מוצר</th>
                                    <th style={thS}>קטגוריה</th>
                                    <th style={{ ...thS, textAlign: "center" as const }}>מחיר</th>
                                    <th style={thS}>מאפיינים</th>
                                    <th style={{ ...thS, textAlign: "center" as const }}>פעולות</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filtered.length === 0 && (
                                    <tr><td colSpan={6} style={{ ...tdS, textAlign: "center" as const, color: "#9ca3af", padding: "32px" }}>אין מוצרים להצגה</td></tr>
                                  )}
                                  {filtered.map((product, fi) => {
                                    return editingProductId === product.id ? (
                                      <tr key={product.id} style={{ background: "#f0f9ff" }}>
                                        <td colSpan={6} style={{ ...tdS, padding: "10px 12px" }}>
                                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                            <input placeholder="שם" value={editingName} onChange={e => setEditingName(e.target.value)} style={{ ...inputStyle, flex: "2 1 120px", padding: "6px 8px", fontSize: "13px" }} />
                                            <input placeholder="קטגוריה" value={editingCategory} onChange={e => setEditingCategory(e.target.value)} style={{ ...inputStyle, flex: "1 1 80px", padding: "6px 8px", fontSize: "13px" }} />
                                            <input type="number" placeholder="₪" value={editingPrice} onChange={e => setEditingPrice(e.target.value)} style={{ ...inputStyle, width: "58px", flex: "0 0 58px", padding: "6px 4px", fontSize: "13px" }} />
                                            <input placeholder="רמות: 5,10,15" value={editingPriceLevels} onChange={e => setEditingPriceLevels(e.target.value)} style={{ ...inputStyle, flex: "1 1 90px", padding: "6px 8px", fontSize: "13px" }} />
                                            <button onClick={() => setEditingGiftTrigger(v => !v)} className="cc-btn" style={toggleBtn(editingGiftTrigger, "sm")} title="מוצר מזכה">🎁</button>
                                            <button onClick={() => setEditingIsGiftBag(v => !v)} className="cc-btn" style={toggleBtn(editingIsGiftBag, "sm")} title="שקית יוקרתית">👜</button>
                                            <button onClick={() => {
                                              if (editingProductId === null || !editingName || !editingPrice || !editingCategory) return;
                                              const parsedLevels = editingPriceLevels.split(/[,\s]+/).map(s => Number(s.trim())).filter(n => n > 0);
                                              setDetailProducts(prev => prev.map(p => p.id === editingProductId
                                                ? { ...p, name: editingName, price: Number(editingPrice), category: editingCategory,
                                                    priceLevels: parsedLevels.length > 0 ? parsedLevels : undefined,
                                                    giftTrigger: editingGiftTrigger || undefined, isGiftBag: editingIsGiftBag || undefined }
                                                : p));
                                              cancelEditProduct();
                                            }} className="cc-btn" style={btn("primary", "sm")}>שמור</button>
                                            <button onClick={cancelEditProduct} className="cc-btn" style={btn("secondary", "sm")}>ביטול</button>
                                          </div>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr key={product.id}>
                                        <td style={{ ...tdS, textAlign: "center" as const, color: "#6b7280", fontWeight: 600 }}>{fi + 1}</td>
                                        <td style={{ ...tdS, fontWeight: 700 }}>
                                          {product.name}
                                          {product.giftTrigger && <span title="מוצר מזכה" style={{ marginRight: "4px" }}>🎁</span>}
                                          {product.isGiftBag && <span title="שקית יוקרתית" style={{ marginRight: "4px" }}>👜</span>}
                                        </td>
                                        <td style={tdS}>
                                          <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: "6px", padding: "2px 8px", fontSize: "12px" }}>{product.category}</span>
                                        </td>
                                        <td style={{ ...tdS, textAlign: "center" as const, fontWeight: 700, color: "#2563eb" }}>
                                          {product.price > 0 ? formatCurrency(product.price) : "—"}
                                        </td>
                                        <td style={{ ...tdS, fontSize: "12px", color: "#6b7280" }}>
                                          {(product.priceLevels ?? []).length > 0 && (product.priceLevels ?? []).map(l => formatCurrency(l)).join(", ")}
                                        </td>
                                        <td style={{ ...tdS, textAlign: "center" as const }}>
                                          <div style={{ display: "flex", gap: "3px", justifyContent: "center", alignItems: "center" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                              <button onClick={() => setDetailProducts(prev => {
                                                const idx = prev.findIndex(p => p.id === product.id);
                                                if (idx <= 0) return prev;
                                                const next = [...prev]; [next[idx], next[idx-1]] = [next[idx-1], next[idx]]; return next;
                                              })} className="cc-btn" style={reorderBtn()} disabled={detailProducts.findIndex(p => p.id === product.id) <= 0}>▲</button>
                                              <button onClick={() => setDetailProducts(prev => {
                                                const idx = prev.findIndex(p => p.id === product.id);
                                                if (idx < 0 || idx >= prev.length - 1) return prev;
                                                const next = [...prev]; [next[idx], next[idx+1]] = [next[idx+1], next[idx]]; return next;
                                              })} className="cc-btn" style={reorderBtn()} disabled={detailProducts.findIndex(p => p.id === product.id) >= detailProducts.length - 1}>▼</button>
                                            </div>
                                            <button onClick={() => startEditProduct(product)} className="cc-btn" style={btn("primary", "sm")}>ערוך</button>
                                            <button onClick={() => showConfirm({
                                              title: "מחיקת מוצר", message: "למחוק מוצר זה מהמכירה?", itemName: product.name,
                                              confirmLabel: "מחק", confirmVariant: "danger",
                                              onConfirm: () => setDetailProducts(prev => prev.filter(p => p.id !== product.id)),
                                            })} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* mobile cards - products */}
                            <div className="sales-mob" style={{ padding: "8px 12px" }}>
                              {filtered.length === 0 && <div style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>אין מוצרים להצגה</div>}
                              {filtered.map(product => (
                                <div key={product.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", marginBottom: "8px", direction: "rtl" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <div style={{ fontWeight: 700 }}>
                                      {product.name}
                                      {product.giftTrigger && <span style={{ marginRight: "4px" }}>🎁</span>}
                                      {product.isGiftBag && <span style={{ marginRight: "4px" }}>👜</span>}
                                    </div>
                                    <span style={{ fontWeight: 700, color: "#2563eb" }}>{product.price > 0 ? formatCurrency(product.price) : "—"}</span>
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                                    <span style={{ background: "#f1f5f9", borderRadius: "6px", padding: "2px 6px" }}>{product.category}</span>
                                    {(product.priceLevels ?? []).length > 0 && <span style={{ marginRight: "6px" }}>{(product.priceLevels ?? []).map(l => formatCurrency(l)).join(", ")}</span>}
                                  </div>
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button onClick={() => startEditProduct(product)} className="cc-btn" style={btn("primary", "sm")}>ערוך</button>
                                    <button onClick={() => showConfirm({
                                      title: "מחיקת מוצר", message: "למחוק מוצר זה?", itemName: product.name,
                                      confirmLabel: "מחק", confirmVariant: "danger",
                                      onConfirm: () => setDetailProducts(prev => prev.filter(p => p.id !== product.id)),
                                    })} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            </div>{/* /scroll area */}
                          </div>
                        );
                      })()}

                      {/* ══ לקוחות / הזמנות ══ */}
                      {saleDayDetailTab === "customers" && (
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                          {detailDay.type === "preorder" ? (() => {
                            const allOrders = detailDay.preOrders ?? [];
                            const pendingCount = allOrders.filter(o => o.status === "pending").length;
                            const paidCount = allOrders.filter(o => o.status === "paid").length;
                            const filteredOrders = allOrders.filter(o => {
                              const matchFilter = ordersFilter === "all" || o.status === ordersFilter;
                              const q = ordersSearch.trim();
                              if (!q) return matchFilter;
                              return matchFilter && (/^[0-9]+$/.test(q) ? phoneMatch(o.customerPhone, q) : nameMatch(o.customerName, q));
                            });
                            const pagedOrders = filteredOrders.slice(ordersPage * PAGE_SIZE, (ordersPage + 1) * PAGE_SIZE);
                            const ordersTotalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
                            return (
                              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                {/* toolbar */}
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, direction: "rtl" }}>
                                  <button onClick={() => openPreOrderForm(detailDay.id)} className="cc-btn" style={btn("success", "sm")}>+ הזמנה חדשה</button>
                                  <div style={{ position: "relative" }}>
                                    <button onClick={() => setShowOrdersActionsMenu(v => !v)}
                                      className="cc-btn" style={btn("ghost", "sm")}>⋯ פעולות</button>
                                    {showOrdersActionsMenu && (
                                      <div style={{ position: "absolute", top: "110%", right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 200, minWidth: "160px", overflow: "hidden" }}
                                        onMouseLeave={() => setShowOrdersActionsMenu(false)}>
                                        <label className="cc-menu-item" style={{ ...menuItemBtn("purple"), display: "flex", alignItems: "center", cursor: "pointer" }}>
                                          ייבוא מאקסל <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={e => { importPreOrdersFromExcel(e, detailDay.id); setShowOrdersActionsMenu(false); }} />
                                        </label>
                                        <button onClick={() => { printAllOrdersList(allOrders.map(o => ({ order: o, dayName: detailDay.name }))); setShowOrdersActionsMenu(false); }}
                                          className="cc-menu-item" style={menuItemBtn("teal")}>הדפס הכל</button>
                                        <button onClick={() => { setShowOrdersActionsMenu(false); showConfirm({ title: "מחיקת כל ההזמנות", message: `למחוק את כל ההזמנות של "${detailDay.name}"?`, confirmLabel: "מחק הכל", confirmVariant: "danger", onConfirm: () => setSaleDays(prev => prev.map(d => d.id === detailDay.id ? { ...d, preOrders: [] } : d)) }); }}
                                          className="cc-menu-item danger" style={menuItemBtn("danger")}>מחק הכל
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <input placeholder="חיפוש לפי שם או טלפון..." value={ordersSearch} onChange={e => { setOrdersSearch(e.target.value); setOrdersPage(0); }}
                                    style={{ ...inputStyle, flex: "1 1 170px", padding: "6px 10px", fontSize: "13px" }} />
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    {([["all", `הכול ${allOrders.length}`], ["pending", `ממתינות ${pendingCount}`], ["paid", `שולמו ${paidCount}`]] as const).map(([f, label]) => (
                                      <button key={f} onClick={() => { setOrdersFilter(f); setOrdersPage(0); }}
                                        className="cc-btn" style={btn(ordersFilter === f ? "primary" : "secondary", "sm")}>{label}</button>
                                    ))}
                                  </div>
                                </div>

                                {/* scroll area */}
                                <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                                {/* desktop table - orders */}
                                <div className="sales-tbl">
                                  <table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl" }}>
                                    <thead>
                                      <tr>
                                        <th style={thS}>לקוח</th>
                                        <th style={thS}>טלפון</th>
                                        <th style={{ ...thS, textAlign: "center" as const }}>מצב</th>
                                        <th style={{ ...thS, textAlign: "center" as const }}>פריטים</th>
                                        <th style={{ ...thS, textAlign: "center" as const }}>סכום</th>
                                        <th style={{ ...thS, textAlign: "center" as const }}>פעולות</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pagedOrders.length === 0 && (
                                        <tr><td colSpan={6} style={{ ...tdS, textAlign: "center" as const, color: "#9ca3af", padding: "32px" }}>אין הזמנות להצגה</td></tr>
                                      )}
                                      {pagedOrders.map(order => {
                                        const isExp = expandedOrderId === order.id;
                                        const orderTotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
                                        return (
                                          <React.Fragment key={order.id}>
                                            <tr style={{ background: order.status === "paid" ? "#f0fdf4" : "white", cursor: "pointer" }}
                                              onClick={() => setExpandedOrderId(isExp ? null : order.id)}>
                                              <td style={{ ...tdS, fontWeight: 700 }}>{order.customerName}</td>
                                              <td style={{ ...tdS, color: "#6b7280" }}>{order.customerPhone || "—"}</td>
                                              <td style={{ ...tdS, textAlign: "center" as const }}>
                                                <span style={{ background: order.status === "paid" ? "#dcfce7" : "#fef3c7", color: order.status === "paid" ? "#15803d" : "#92400e", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>
                                                  {order.status === "paid" ? "✓ שולמה" : "ממתינה"}
                                                </span>
                                              </td>
                                              <td style={{ ...tdS, textAlign: "center" as const }}>{order.items.length}</td>
                                              <td style={{ ...tdS, textAlign: "center" as const, fontWeight: 700, color: "#1e40af" }}>{formatCurrency(orderTotal)}</td>
                                              <td style={{ ...tdS, textAlign: "center" as const }} onClick={e => e.stopPropagation()}>
                                                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                                  {order.status === "pending" && <button onClick={() => openPreOrderForm(detailDay.id, order)} className="cc-btn" style={btn("primary", "sm")}>ערוך</button>}
                                                  <button onClick={() => printSingleOrder(order, detailDay.name)} className="cc-btn" style={btn("teal", "sm")}>הדפס</button>
                                                  <button onClick={() => deletePreOrder(detailDay.id, order.id)} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                                                </div>
                                              </td>
                                            </tr>
                                            {isExp && (
                                              <tr>
                                                <td colSpan={6} style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", direction: "rtl" }}>
                                                  {order.items.map((i, idx) => (
                                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "13px" }}>
                                                      <span>{i.name} ×{i.qty}</span><span style={{ color: "#6b7280" }}>{formatCurrency(i.price * i.qty)}</span>
                                                    </div>
                                                  ))}
                                                  {order.notes && <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>{order.notes}</div>}
                                                  <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "6px", borderTop: "1px solid #f1f5f9", paddingTop: "4px" }}>סה"כ: {formatCurrency(orderTotal)}</div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* mobile cards - orders */}
                                <div className="sales-mob" style={{ padding: "8px 12px" }}>
                                  {pagedOrders.length === 0 && <div style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>אין הזמנות</div>}
                                  {pagedOrders.map(order => {
                                    const isExp = expandedOrderId === order.id;
                                    const orderTotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
                                    return (
                                      <div key={order.id} style={{ background: order.status === "paid" ? "#f0fdf4" : "#f8fafc", border: `1px solid ${order.status === "paid" ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "8px", direction: "rtl" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                          <span style={{ fontWeight: 700 }}>{order.customerName}</span>
                                          <span style={{ fontWeight: 700, color: "#1e40af" }}>{formatCurrency(orderTotal)}</span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", display: "flex", gap: "8px" }}>
                                          <span>{order.customerPhone || "—"}</span>
                                          <span style={{ background: order.status === "paid" ? "#dcfce7" : "#fef3c7", color: order.status === "paid" ? "#15803d" : "#92400e", borderRadius: "6px", padding: "1px 6px", fontWeight: 600 }}>{order.status === "paid" ? "שולמה" : "ממתינה"}</span>
                                          <span>{order.items.length} פריטים</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                          {order.status === "pending" && <button onClick={() => openPreOrderForm(detailDay.id, order)} className="cc-btn" style={btn("primary", "sm")}>ערוך</button>}
                                          <button onClick={() => printSingleOrder(order, detailDay.name)} className="cc-btn" style={btn("teal", "sm")}>הדפס</button>
                                          <button onClick={() => deletePreOrder(detailDay.id, order.id)} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                                          <button onClick={() => setExpandedOrderId(isExp ? null : order.id)} className="cc-btn" style={btn("ghost", "sm")}>{isExp ? "▲" : "▼"}</button>
                                        </div>
                                        {isExp && (
                                          <div style={{ marginTop: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                                            {order.items.map((i, idx) => (
                                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                                <span>{i.name} ×{i.qty}</span><span>{formatCurrency(i.price * i.qty)}</span>
                                              </div>
                                            ))}
                                            {order.notes && <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>{order.notes}</div>}
                                            <div style={{ fontWeight: 700, marginTop: "4px" }}>סה"כ: {formatCurrency(orderTotal)}</div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* pagination - orders */}
                                {ordersTotalPages > 1 && (
                                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "12px" }}>
                                    <button onClick={() => setOrdersPage(p => Math.max(0, p - 1))} disabled={ordersPage === 0} className="cc-btn" style={btn("secondary", "sm")}>‹ הקודם</button>
                                    <span style={{ fontSize: "13px", color: "#6b7280", lineHeight: "30px" }}>{ordersPage + 1} / {ordersTotalPages}</span>
                                    <button onClick={() => setOrdersPage(p => Math.min(ordersTotalPages - 1, p + 1))} disabled={ordersPage >= ordersTotalPages - 1} className="cc-btn" style={btn("secondary", "sm")}>הבא ›</button>
                                  </div>
                                )}
                                </div>{/* /scroll area */}
                              </div>
                            );
                          })() : (() => {
                            const walkinCustomers = detailDay.customers ?? [];
                            const filteredCustomers = walkinCustomers.filter(c => {
                              const q = customersTabSearch.trim();
                              if (!q || q.length < 2) return true;
                              if (/^[0-9]+$/.test(q)) return phoneMatch(c.phone, q);
                              const qLow = q.toLowerCase();
                              return String(c.name || "").toLowerCase().split(" ").some(w => w.startsWith(qLow));
                            });
                            const pagedCustomers = filteredCustomers.slice(customersPage * PAGE_SIZE, (customersPage + 1) * PAGE_SIZE);
                            const customersTotalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
                            return (
                              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                {/* toolbar */}
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, direction: "rtl" }}>
                                  <button onClick={() => { setShowNewCustomerModalDayId(detailDay.id); setNewCustomerName(""); setNewCustomerPhone(""); setNewCustomerIdNumber(""); setNewCustomerType("3"); }}
                                    className="cc-btn" style={btn("success", "sm")}>+ לקוח חדש</button>
                                  <div style={{ position: "relative" }}>
                                    <button onClick={() => setShowCustomersActionsMenu(v => !v)} className="cc-btn" style={btn("ghost", "sm")}>⋯ פעולות</button>
                                    {showCustomersActionsMenu && (
                                      <div style={{ position: "absolute", top: "110%", right: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 200, minWidth: "160px", overflow: "hidden" }}
                                        onMouseLeave={() => setShowCustomersActionsMenu(false)}>
                                        <label className="cc-menu-item" style={{ ...menuItemBtn("purple"), display: "flex", alignItems: "center", cursor: "pointer" }}>
                                          ייבוא מאקסל <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => { importCustomersForDay(e, detailDay.id); setShowCustomersActionsMenu(false); }} />
                                        </label>
                                        <button onClick={() => { setShowCustomersActionsMenu(false); showConfirm({ title: "מחיקת כל הלקוחות", message: "למחוק את כל הלקוחות מהמכירה?", confirmLabel: "מחק הכל", confirmVariant: "danger", onConfirm: () => deleteAllCustomersForDay(detailDay.id) }); }}
                                          className="cc-menu-item danger" style={menuItemBtn("danger")}>מחק הכל</button>
                                      </div>
                                    )}
                                  </div>
                                  <input placeholder="חיפוש לפי שם או טלפון..." value={customersTabSearch} onChange={e => { setCustomersTabSearch(e.target.value); setCustomersPage(0); }}
                                    style={{ ...inputStyle, flex: "1 1 170px", padding: "6px 10px", fontSize: "13px" }} />
                                  <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>{filteredCustomers.length} לקוחות</span>
                                </div>

                                {/* scroll area */}
                                <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                                {/* desktop table - customers */}
                                <div className="sales-tbl">
                                  <table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl" }}>
                                    <thead>
                                      <tr>
                                        <th style={thS}>שם</th>
                                        <th style={thS}>טלפון</th>
                                        {detailDay.type === "walkin" && <th style={{ ...thS, textAlign: "center" as const }}>הנחה</th>}
                                        <th style={{ ...thS, textAlign: "center" as const }}>פעולות</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pagedCustomers.length === 0 && (
                                        <tr><td colSpan={detailDay.type === "walkin" ? 4 : 3} style={{ ...tdS, textAlign: "center" as const, color: "#9ca3af", padding: "32px" }}>אין לקוחות להצגה</td></tr>
                                      )}
                                      {pagedCustomers.map((customer, pageIdx) => {
                                        const fi = customersPage * PAGE_SIZE + pageIdx;
                                        const isEditing = editingCustomerId === customer.id && editingCustomerIdx === fi;
                                        const discountLabel = detailDay.type === "walkin"
                                          ? customer.customerType === "1" ? "25%" : customer.customerType === "2" ? "15%" : "0%"
                                          : null;
                                        return isEditing ? (
                                          <tr key={`${customer.id}-${fi}`} style={{ background: "#f0f9ff" }}>
                                            <td colSpan={detailDay.type === "walkin" ? 4 : 3} style={{ ...tdS, padding: "10px 12px" }}>
                                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                                <input placeholder="שם" value={editingCustomerName} onChange={e => setEditingCustomerName(e.target.value)} style={{ ...inputStyle, flex: "1 1 140px", fontSize: "13px" }} />
                                                <input placeholder="טלפון" value={editingCustomerPhone} onChange={e => setEditingCustomerPhone(e.target.value)} style={{ ...inputStyle, flex: "1 1 120px", fontSize: "13px" }} />
                                                <input placeholder="ת.ז." value={editingCustomerIdNumber} onChange={e => setEditingCustomerIdNumber(e.target.value)} style={{ ...inputStyle, flex: "1 1 100px", fontSize: "13px" }} />
                                                {detailDay.type === "walkin" && (
                                                  <select value={editingCustomerType} onChange={e => setEditingCustomerType(e.target.value as CustomerType)} style={{ ...inputStyle, flex: "0 0 80px", fontSize: "13px" }}>
                                                    <option value="1">25%</option><option value="2">15%</option><option value="3">ללא הנחה</option>
                                                  </select>
                                                )}
                                                <button onClick={() => saveEditedCustomerForDay(detailDay.id)} className="cc-btn" style={btn("primary", "sm")}>שמור</button>
                                                <button onClick={cancelEditCustomer} className="cc-btn" style={btn("secondary", "sm")}>ביטול</button>
                                              </div>
                                            </td>
                                          </tr>
                                        ) : (
                                          <tr key={`${customer.id}-${fi}`}>
                                            <td style={{ ...tdS, fontWeight: 700 }}>{customer.name}</td>
                                            <td style={{ ...tdS, color: "#6b7280" }}>{customer.phone || "—"}</td>
                                            {detailDay.type === "walkin" && (
                                              <td style={{ ...tdS, textAlign: "center" as const }}>
                                                <span style={{ fontSize: "12px", fontWeight: 600, background: discountLabel !== "0%" ? "#eff6ff" : "#f1f5f9", color: discountLabel !== "0%" ? "#2563eb" : "#6b7280", borderRadius: "8px", padding: "2px 8px" }}>{discountLabel}</span>
                                              </td>
                                            )}
                                            <td style={{ ...tdS, textAlign: "center" as const }}>
                                              <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                                <button onClick={() => setHistoryCustomerId(customer.id)} className="cc-btn" style={btn("ghost", "sm")}>היסטוריה</button>
                                                <button onClick={() => startEditCustomer(customer, fi)} className="cc-btn" style={btn("secondary", "sm")}>ערוך</button>
                                                <button onClick={() => deleteCustomerForDay(customer.id, detailDay.id)} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* mobile cards - customers */}
                                <div className="sales-mob" style={{ padding: "8px 12px" }}>
                                  {pagedCustomers.length === 0 && <div style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>אין לקוחות</div>}
                                  {pagedCustomers.map((customer, pageIdx) => {
                                    const fi = customersPage * PAGE_SIZE + pageIdx;
                                    const discountLabel = detailDay.type === "walkin"
                                      ? customer.customerType === "1" ? "25%" : customer.customerType === "2" ? "15%" : null
                                      : null;
                                    return (
                                      <div key={`${customer.id}-m`} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", marginBottom: "8px", direction: "rtl" }}>
                                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>{customer.name}</div>
                                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", display: "flex", gap: "8px" }}>
                                          <span>{customer.phone || "—"}</span>
                                          {discountLabel && <span style={{ background: "#eff6ff", color: "#2563eb", borderRadius: "6px", padding: "1px 6px" }}>הנחה {discountLabel}</span>}
                                        </div>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                          <button onClick={() => setHistoryCustomerId(customer.id)} className="cc-btn" style={btn("ghost", "sm")}>היסטוריה</button>
                                          <button onClick={() => startEditCustomer(customer, fi)} className="cc-btn" style={btn("secondary", "sm")}>ערוך</button>
                                          <button onClick={() => deleteCustomerForDay(customer.id, detailDay.id)} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* pagination - customers */}
                                {customersTotalPages > 1 && (
                                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "12px" }}>
                                    <button onClick={() => setCustomersPage(p => Math.max(0, p - 1))} disabled={customersPage === 0} className="cc-btn" style={btn("secondary", "sm")}>‹ הקודם</button>
                                    <span style={{ fontSize: "13px", color: "#6b7280", lineHeight: "30px" }}>{customersPage + 1} / {customersTotalPages}</span>
                                    <button onClick={() => setCustomersPage(p => Math.min(customersTotalPages - 1, p + 1))} disabled={customersPage >= customersTotalPages - 1} className="cc-btn" style={btn("secondary", "sm")}>הבא ›</button>
                                  </div>
                                )}

                                {/* history modal */}
                                {historyCustomerId !== null && (
                                  <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}
                                    onClick={() => setHistoryCustomerId(null)}>
                                    <div style={{ padding: "24px", background: "#f0fdf4", borderRadius: "12px", width: "550px", maxWidth: "92%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}
                                      onClick={e => e.stopPropagation()}>
                                      <h3>היסטוריית רכישות — {walkinCustomers.find(c => c.id === historyCustomerId)?.name}</h3>
                                      <button onClick={() => setHistoryCustomerId(null)} className="cc-btn" style={{ ...btn("secondary", "sm"), marginBottom: "10px" }}>סגור</button>
                                      {(() => {
                                        const history = getCustomerHistoryForDay(historyCustomerId, detailDay.id);
                                        if (history.length === 0) return <div style={{ color: "#6b7280" }}>אין עסקאות להצגה</div>;
                                        return history.map(t => (
                                          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "8px 12px", borderBottom: "1px solid #ddd", fontSize: "12px", flexWrap: "wrap" }}>
                                            <div>{t.date}</div>
                                            <div>{t.seller}</div>
                                            <div style={{ minWidth: "100px", fontWeight: "bold" }}>{formatCurrency(t.finalTotal)}</div>
                                            <div style={{ fontSize: "11px", color: "#666" }}>{t.items.map(i => `${i.name} (${i.qty})`).join(", ")}</div>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>
                                )}
                                </div>{/* /scroll area */}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* ══ עסקאות ══ */}
                      {saleDayDetailTab === "transactions" && (() => {
                        const allTxs = detailDay.transactions ?? [];
                        const txQ = txSearch.trim();
                        const filteredTxs = txQ.length < 2 ? allTxs : allTxs.filter(t => {
                          if (/^[0-9]+$/.test(txQ)) return phoneMatch(t.customerPhone, txQ);
                          return nameMatch(t.customerName, txQ);
                        });
                        const pagedTxs = filteredTxs.slice(txPage * PAGE_SIZE, (txPage + 1) * PAGE_SIZE);
                        const txTotalPages = Math.ceil(filteredTxs.length / PAGE_SIZE);
                        const fmtDate = (t: typeof allTxs[0]) => {
                          try {
                            const d = t.dateISO ? new Date(t.dateISO) : new Date(t.date);
                            if (isNaN(d.getTime())) return t.date;
                            return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
                          } catch { return t.date; }
                        };
                        return (
                          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                            {/* toolbar */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, direction: "rtl" }}>
                              <input placeholder="חיפוש לפי שם או טלפון..." value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxPage(0); }}
                                style={{ ...inputStyle, flex: "1 1 180px", padding: "6px 10px", fontSize: "13px" }} />
                              <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>{filteredTxs.length} עסקאות</span>
                              <div style={{ position: "relative" }}>
                                <button onClick={() => setShowTxActionsMenu(v => !v)} className="cc-btn" style={btn("ghost", "sm")}>⋯ פעולות</button>
                                {showTxActionsMenu && (
                                  <div style={{ position: "absolute", top: "110%", left: 0, background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 200, minWidth: "170px", overflow: "hidden" }}
                                    onMouseLeave={() => setShowTxActionsMenu(false)}>
                                    <button onClick={() => {
                                      setShowTxActionsMenu(false);
                                      showConfirm({
                                        title: "איפוס עסקאות",
                                        message: `למחוק את כל ${allTxs.length} העסקאות של "${detailDay.name}"? פעולה זו אינה הפיכה.`,
                                        itemName: detailDay.name, confirmLabel: "מחק הכל", confirmVariant: "danger",
                                        onConfirm: () => setSaleDays(prev => prev.map(d => d.id === detailDay.id ? { ...d, transactions: [] } : d)),
                                      });
                                    }} className="cc-menu-item danger" style={menuItemBtn("danger")}>🗑 איפוס עסקאות</button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* scroll area */}
                            <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                            {/* desktop table - transactions */}
                            <div className="sales-tbl">
                              <table style={{ width: "100%", borderCollapse: "collapse", direction: "rtl" }}>
                                <thead>
                                  <tr>
                                    <th style={thS}>לקוח</th>
                                    <th style={thS}>טלפון</th>
                                    <th style={thS}>מוכר</th>
                                    <th style={{ ...thS, textAlign: "center" as const }}>סכום</th>
                                    <th style={{ ...thS, textAlign: "center" as const }}>אמצעי תשלום</th>
                                    <th style={{ ...thS, textAlign: "center" as const }}>תאריך ושעה</th>
                                    <th style={{ ...thS, textAlign: "center" as const }}>פירוט</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pagedTxs.length === 0 && (
                                    <tr><td colSpan={7} style={{ ...tdS, textAlign: "center" as const, color: "#9ca3af", padding: "32px" }}>אין עסקאות</td></tr>
                                  )}
                                  {pagedTxs.map(tx => {
                                    const isExp = expandedTransactionId === tx.id;
                                    return (
                                      <React.Fragment key={tx.id}>
                                        <tr style={{ background: tx.isReturn ? "#fff1f1" : "white" }}>
                                          <td style={{ ...tdS, fontWeight: 700 }}>{tx.customerName}</td>
                                          <td style={{ ...tdS, color: "#6b7280" }}>{tx.customerPhone || "—"}</td>
                                          <td style={{ ...tdS, color: "#374151" }}>{tx.seller}</td>
                                          <td style={{ ...tdS, textAlign: "center" as const, fontWeight: 700, color: tx.isReturn ? "#dc2626" : "#16a34a" }}>{formatCurrency(tx.finalTotal)}</td>
                                          <td style={{ ...tdS, textAlign: "center" as const }}>
                                            <span style={{ fontSize: "12px", fontWeight: 600, background: tx.isReturn ? "#fee2e2" : "#e0f2fe", color: tx.isReturn ? "#dc2626" : "#0891b2", borderRadius: "8px", padding: "2px 8px" }}>
                                              {tx.isReturn ? "↩ החזרה" : ({ cash: "מזומן", check: "המחאה", credit: "אשראי" }[tx.paymentMethod ?? ""] ?? tx.paymentMethod ?? "")}
                                            </span>
                                          </td>
                                          <td style={{ ...tdS, textAlign: "center" as const, fontSize: "12px", color: "#64748b" }}>{fmtDate(tx)}</td>
                                          <td style={{ ...tdS, textAlign: "center" as const }}>
                                            <button onClick={() => setExpandedTransactionId(isExp ? null : tx.id)} className="cc-btn" style={btn("ghost", "sm")}>{isExp ? "▲" : "▼"}</button>
                                          </td>
                                        </tr>
                                        {isExp && (
                                          <tr>
                                            <td colSpan={7} style={{ background: "white", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", direction: "rtl" }}>
                                              {tx.items.map((item, i) => (
                                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}>
                                                  <span>{item.name} × {item.qty}</span>
                                                  <span style={{ color: "#374151", fontWeight: 600 }}>{formatCurrency(item.price * item.qty)}</span>
                                                </div>
                                              ))}
                                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontWeight: 700, direction: "rtl" }}>
                                                <span>סה"כ</span><span>{formatCurrency(tx.finalTotal)}</span>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* mobile cards - transactions */}
                            <div className="sales-mob" style={{ padding: "8px 12px" }}>
                              {pagedTxs.length === 0 && <div style={{ color: "#9ca3af", padding: "20px", textAlign: "center" }}>אין עסקאות</div>}
                              {pagedTxs.map(tx => {
                                const isExp = expandedTransactionId === tx.id;
                                return (
                                  <div key={tx.id} style={{ background: tx.isReturn ? "#fff1f1" : "#f8fafc", border: `1px solid ${tx.isReturn ? "#fca5a5" : "#e2e8f0"}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "8px", direction: "rtl" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                      <span style={{ fontWeight: 700 }}>{tx.customerName}</span>
                                      <span style={{ fontWeight: 700, color: tx.isReturn ? "#dc2626" : "#16a34a" }}>{formatCurrency(tx.finalTotal)}</span>
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                      <span>{tx.customerPhone || "—"}</span>
                                      <span>{tx.seller}</span>
                                      <span style={{ background: tx.isReturn ? "#fee2e2" : "#e0f2fe", color: tx.isReturn ? "#dc2626" : "#0891b2", borderRadius: "6px", padding: "1px 6px", fontWeight: 600 }}>
                                        {tx.isReturn ? "החזרה" : ({ cash: "מזומן", check: "המחאה", credit: "אשראי" }[tx.paymentMethod ?? ""] ?? "")}
                                      </span>
                                      <span>{fmtDate(tx)}</span>
                                    </div>
                                    <button onClick={() => setExpandedTransactionId(isExp ? null : tx.id)} className="cc-btn" style={btn("ghost", "sm")}>{isExp ? "▲ סגור" : "▼ פירוט"}</button>
                                    {isExp && (
                                      <div style={{ marginTop: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                                        {tx.items.map((item, i) => (
                                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                            <span>{item.name} ×{item.qty}</span><span>{formatCurrency(item.price * item.qty)}</span>
                                          </div>
                                        ))}
                                        <div style={{ fontWeight: 700, marginTop: "4px" }}>סה"כ: {formatCurrency(tx.finalTotal)}</div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* pagination - transactions */}
                            {txTotalPages > 1 && (
                              <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "12px" }}>
                                <button onClick={() => setTxPage(p => Math.max(0, p - 1))} disabled={txPage === 0} className="cc-btn" style={btn("secondary", "sm")}>‹ הקודם</button>
                                <span style={{ fontSize: "13px", color: "#6b7280", lineHeight: "30px" }}>{txPage + 1} / {txTotalPages}</span>
                                <button onClick={() => setTxPage(p => Math.min(txTotalPages - 1, p + 1))} disabled={txPage >= txTotalPages - 1} className="cc-btn" style={btn("secondary", "sm")}>הבא ›</button>
                              </div>
                            )}
                            </div>{/* /scroll area */}
                          </div>
                        );
                      })()}

                      {/* ══ סיכום ══ */}
                      {saleDayDetailTab === "summary" && (() => {
                        const txs = detailDay.transactions ?? [];
                        const sales = txs.filter(t => !t.isReturn);
                        const returns = txs.filter(t => t.isReturn);
                        const grossTotal = sales.reduce((s, t) => s + t.finalTotal, 0);
                        const returnTotal = returns.reduce((s, t) => s + t.finalTotal, 0);
                        const netTotal = grossTotal + returnTotal;
                        const totalItems = sales.reduce((s, t) => s + t.items.reduce((ss, i) => ss + i.qty, 0), 0);
                        const listCount = detailDay.type === "preorder" ? (detailDay.preOrders ?? []).length : (detailDay.customers ?? []).length;
                        const byMethod: Record<string, number> = {};
                        sales.forEach(t => { const m = t.paymentMethod ?? ""; byMethod[m] = (byMethod[m] ?? 0) + t.finalTotal; });
                        const methodLabel = (m: string) => ({ cash: "מזומן", check: "המחאה", credit: "אשראי" }[m] ?? (m || "לא ידוע"));
                        const summaryItems: { label: string; value: string; color?: string }[] = [
                          { label: "עסקאות", value: formatTransactionCount(sales.length), color: "#1e40af" },
                          { label: "מכירות ברוטו", value: formatCurrency(grossTotal), color: "#15803d" },
                          ...(returns.length > 0 ? [{ label: `החזרות (${returns.length})`, value: formatCurrency(Math.abs(returnTotal)), color: "#dc2626" }] : []),
                          { label: 'סה"כ נטו', value: formatCurrency(netTotal), color: "#374151" },
                          { label: "פריטים שנמכרו", value: `${totalItems}` },
                          { label: detailDay.type === "preorder" ? "הזמנות" : "לקוחות", value: `${listCount}` },
                        ];
                        return (
                          <div style={{ padding: "20px", direction: "rtl", overflowY: "auto", flex: 1 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                              {summaryItems.map(c => (
                                <div key={c.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, marginBottom: "4px" }}>{c.label}</div>
                                  <div style={{ fontSize: "18px", fontWeight: 700, color: c.color ?? "#374151" }}>{c.value}</div>
                                </div>
                              ))}
                            </div>
                            {Object.keys(byMethod).length > 0 && (
                              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>חלוקה לפי אמצעי תשלום</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                  {Object.entries(byMethod).map(([m, amt]) => (
                                    <div key={m} style={{ background: "white", borderRadius: "10px", padding: "10px 14px", border: "1px solid #e2e8f0", minWidth: "110px" }}>
                                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{methodLabel(m)}</div>
                                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e40af" }}>{formatCurrency(amt)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}





        {!cashierMode && adminTab === "settings" && (
          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden" }}>
            {/* טאבים */}
            <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", direction: "rtl" }}>
              {([["sellers","מוכרים"],["backup","גיבוי ושחזור"],["maintenance","תחזוקת נתונים"],["log","יומן פעילות"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setSettingsTab(key)} className="cc-underline-tab"
                  style={underlineTabBtn(settingsTab === key)}>
                  {label}{key === "maintenance" && pendingSales.filter(s => !s.saleDayId).length > 0 ? ` (${pendingSales.filter(s => !s.saleDayId).length})` : ""}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px" }}>
              {/* ── מוכרים ── */}
              {settingsTab === "sellers" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", direction: "rtl" }}>
                    <h3 style={{ margin: 0, fontSize: "17px" }}>מוכרים ({sellers.length})</h3>
                    <button onClick={() => setShowAddSellerModal(true)} className="cc-btn" style={btn("primary")}>+ הוסף מוכר</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {sellers.map(seller => (
                      <div key={seller.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", direction: "rtl" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontWeight: 600 }}>{seller.name}</span>
                          {seller.isAdmin && <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>מנהל</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#6b7280", cursor: "pointer" }}>
                            <input type="checkbox" checked={seller.isAdmin} onChange={e => setSellers(prev => prev.map(s => s.name === seller.name ? { ...s, isAdmin: e.target.checked } : s))} />
                            מנהל
                          </label>
                          <button onClick={() => showConfirm({ title: "מחיקת מוכר", message: "למחוק מוכר זה?", itemName: seller.name, confirmLabel: "מחק", confirmVariant: "danger", onConfirm: () => setSellers(prev => prev.filter(s => s.name !== seller.name)) })} className="cc-btn" style={btn("danger", "sm")}>מחק</button>
                        </div>
                      </div>
                    ))}
                    {sellers.length === 0 && <div style={{ color: "#9ca3af", fontSize: "14px", padding: "16px" }}>אין מוכרים רשומים</div>}
                  </div>
                </div>
              )}

              {/* ── גיבוי ושחזור ── */}
              {settingsTab === "backup" && (
                <div style={{ direction: "rtl" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: "17px" }}>גיבוי ושחזור</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#374151" }}>הורדת גיבוי מלא</h4>
                      <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#6b7280" }}>מוריד קובץ JSON עם כל הנתונים: מכירות, לקוחות, עסקאות, מחסן ועוד.</p>
                      <button onClick={exportBackup} className="cc-btn" style={btn("primary")}>הורד גיבוי</button>
                    </div>
                    <div style={{ background: "#fef9c3", borderRadius: "12px", padding: "20px", border: "1px solid #fde68a" }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#92400e" }}>שחזור מגיבוי</h4>
                      <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#78350f" }}>שחזור גיבוי ידרוס את כל הנתונים הקיימים. בצע פעולה זו בזהירות.</p>
                      <label style={{ ...btn("warning"), display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        בחר קובץ גיבוי
                        <input type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── תחזוקת נתונים ── */}
              {settingsTab === "maintenance" && (() => {
                const orphans = pendingSales.filter(s => !s.saleDayId);
                return (
                  <div style={{ direction: "rtl" }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: "17px" }}>תחזוקת נתונים</h3>
                    {orphans.length === 0 ? (
                      <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "20px", border: "1px solid #86efac", color: "#15803d", fontWeight: 600 }}>כל הנתונים תקינים — אין עסקאות ממתינות ללא שיוך</div>
                    ) : (
                      <div>
                        <div style={{ background: "#fef3c7", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#92400e", fontSize: "14px", fontWeight: 600 }}>
                          {orphans.length} עסקאות המתנה ללא שיוך ליום מכירה — בחר יום עבור כל אחת ולחץ שמור.
                        </div>
                        {orphans.map(s => (
                          <div key={s.id} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px", padding: "10px 14px", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, fontSize: "13px", minWidth: "160px" }}>
                              <strong>{s.customerName}</strong> — {s.date} — ₪{s.finalTotal.toFixed(2)}
                              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{s.items.map(i => `${i.name} ×${i.qty}`).join(", ")}</div>
                            </div>
                            <select value={orphanPendingDayIds[s.id] ?? ""} onChange={e => setOrphanPendingDayIds(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                              style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                              <option value="">בחר יום...</option>
                              {saleDays.map(d => <option key={d.id} value={d.id}>{d.name}{d.isActive ? " (פעיל)" : ""}</option>)}
                            </select>
                            <button disabled={!orphanPendingDayIds[s.id]} onClick={() => {
                              const dayId = orphanPendingDayIds[s.id];
                              if (!dayId) return;
                              setPendingSales(prev => prev.map(p => p.id === s.id ? { ...p, saleDayId: dayId } : p));
                              setOrphanPendingDayIds(prev => { const next = { ...prev }; delete next[s.id]; return next; });
                            }} className="cc-btn" style={btn("primary", "sm")}>שמור</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── יומן פעילות ── */}
              {settingsTab === "log" && (
                <div style={{ direction: "rtl" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "17px" }}>יומן פעילות ({activityLog.length})</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input placeholder="חיפוש..." value={logSearch} onChange={e => setLogSearch(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", direction: "rtl" }} />
                      <select value={logSellerFilter} onChange={e => setLogSellerFilter(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", direction: "rtl" }}>
                        <option value="">כל המוכרים</option>
                        {sellers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                      {activityLog.length > 0 && (
                        <button onClick={() => showConfirm({ title: "ניקוי יומן פעילות", message: "למחוק את כל יומן הפעילות?", confirmLabel: "נקה", confirmVariant: "danger", onConfirm: () => setActivityLog([]) })}
                          className="cc-btn" style={btn("danger", "sm")}>נקה יומן</button>
                      )}
                    </div>
                  </div>
                  {activityLog.length === 0 ? (
                    <div style={{ color: "#9ca3af", fontSize: "14px", padding: "24px", textAlign: "center" }}>יומן הפעילות ריק</div>
                  ) : (
                    <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr>
                            <th style={{ padding: "8px 12px", textAlign: "right", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0 }}>תאריך</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0 }}>מוכר</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0 }}>פעולה</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityLog.filter(e => {
                            if (logSearch && !e.action.includes(logSearch) && !e.seller.includes(logSearch)) return false;
                            if (logSellerFilter && e.seller !== logSellerFilter) return false;
                            return true;
                          }).slice(0, 200).map(entry => (
                            <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "7px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{entry.date}</td>
                              <td style={{ padding: "7px 12px" }}>{entry.seller}</td>
                              <td style={{ padding: "7px 12px" }}>{entry.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ Add Seller Modal ══ */}
        {showAddSellerModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 8000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowAddSellerModal(false)}>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px 28px", minWidth: "280px", direction: "rtl", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 16px", fontSize: "17px" }}>הוספת מוכר</h3>
              <input placeholder="שם מוכר" value={newSeller} onChange={e => setNewSeller(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { addSeller(); setShowAddSellerModal(false); } }}
                style={{ ...inputStyle, width: "100%", marginBottom: "12px", boxSizing: "border-box" }} autoFocus />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { addSeller(); setShowAddSellerModal(false); }} className="cc-btn" style={btn("primary")}>הוסף</button>
                <button onClick={() => setShowAddSellerModal(false)} className="cc-btn" style={btn("secondary")}>ביטול</button>
              </div>
            </div>
          </div>
        )}

        {!cashierMode && adminTab === "reports" && (() => {
          const isAllDays = reportsDayId === "all";
          const selectedDays = isAllDays ? saleDays : saleDays.filter(d => d.id === reportsDayId);

          const reportEntries = selectedDays.flatMap(day =>
            (day.transactions ?? []).map(transaction => ({ transaction, saleDay: day }))
          );

          const salesEntries = reportEntries.filter(e => !e.transaction.isReturn);
          const returnsEntries = reportEntries.filter(e => e.transaction.isReturn);
          const grossTotal = salesEntries.reduce((s, e) => s + e.transaction.finalTotal, 0);
          const returnsTotal = returnsEntries.reduce((s, e) => s + e.transaction.finalTotal, 0);
          const netTotal = grossTotal + returnsTotal;

          const getDaily = () => reportEntries.reduce((acc: Record<string, number>, { transaction: t }) => {
            const d = t.dateISO ? new Date(t.dateISO) : new Date(t.date);
            const key = d.toLocaleDateString("en-GB");
            acc[key] = (acc[key] || 0) + t.finalTotal;
            return acc;
          }, {});
          const getMonthly = () => reportEntries.reduce((acc: Record<string, number>, { transaction: t }) => {
            const d = t.dateISO ? new Date(t.dateISO) : new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            acc[key] = (acc[key] || 0) + t.finalTotal;
            return acc;
          }, {});
          const getByCategory = () => reportEntries.reduce((acc: Record<string, number>, { transaction: t, saleDay }) => {
            const gross = t.items.reduce((s, i) => s + i.price * i.qty, 0);
            if (gross === 0) return acc;
            const ratio = t.finalTotal / gross;
            const dayProds = saleDay.products ?? [];
            t.items.forEach(item => {
              const product = dayProds.find(p => p.id === item.id);
              const cat = product?.category || "לא ידוע";
              acc[cat] = (acc[cat] || 0) + item.price * item.qty * ratio;
            });
            return acc;
          }, {});
          const getByCustomer = () => reportEntries.reduce((acc: Record<string, number>, { transaction: t }) => {
            acc[t.customerName] = (acc[t.customerName] || 0) + t.finalTotal;
            return acc;
          }, {});
          const getBySeller = () => reportEntries.reduce((acc: Record<string, number>, { transaction: t }) => {
            acc[t.seller] = (acc[t.seller] || 0) + t.finalTotal;
            return acc;
          }, {});

          const doExport = () => {
            const allProductNames = [...new Set(reportEntries.flatMap(({ transaction: t }) => t.items.map(i => i.name)))];
            const transactionsRows = reportEntries.map(({ transaction: t, saleDay }) => {
              const paymentLabels: Record<string, string> = { cash: "מזומן", credit: "אשראי", check: "המחאה" };
              const row: Record<string, string | number> = {};
              if (isAllDays) row["יום מכירה"] = saleDay.name;
              row["תאריך"] = t.date;
              row["לקוח"] = t.customerName;
              row["טלפון"] = t.customerPhone;
              row["מוכר"] = t.seller;
              row["שיטת_תשלום"] = paymentLabels[t.paymentMethod ?? ""] ?? t.paymentMethod ?? "";
              row["תשלומים"] = t.installments ?? 1;
              row["סכום"] = t.finalTotal;
              for (const name of allProductNames) {
                const item = t.items.find(i => i.name === name);
                row[name] = item ? item.qty : "";
              }
              return row;
            });
            const custRows = isAllDays
              ? selectedDays.flatMap(d => (d.customers ?? []).map(c => ({ "יום מכירה": d.name, id: c.id, name: c.name, phone: c.phone, idNumber: c.idNumber, customerType: c.customerType })))
              : (selectedDays[0]?.customers ?? []).map(c => ({ id: c.id, name: c.name, phone: c.phone, idNumber: c.idNumber, customerType: c.customerType }));
            const prodRows = isAllDays
              ? selectedDays.flatMap(d => (d.products ?? []).map(p => ({ "יום מכירה": d.name, id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock })))
              : (selectedDays[0]?.products ?? []).map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, stock: p.stock }));
            const sellersRows = sellers.map(s => ({ מוכר: s.name, מנהל: s.isAdmin ? "כן" : "לא" }));
            const filteredPending = isAllDays
              ? pendingSales
              : pendingSales.filter(s => s.saleDayId === reportsDayId);
            const pendingRows = filteredPending.map(t => ({
              תאריך: t.date, לקוח: t.customerName, טלפון: t.customerPhone, מוכר: t.seller, סכום: t.finalTotal,
              מוצרים: t.items.map(i => `${i.name} x${i.qty}`).join(" | "),
            }));
            const wb = XLSX.utils.book_new();
            const rtlView = [{ rightToLeft: true, RTL: true }];
            const addSheet = (rows: object[], sheetName: string) => {
              if (rows.length === 0) return;
              const ws = XLSX.utils.json_to_sheet(rows);
              (ws as any)["!views"] = rtlView;
              XLSX.utils.book_append_sheet(wb, ws, sheetName);
            };
            addSheet(transactionsRows, "עסקאות");
            addSheet(custRows, "לקוחות");
            addSheet(prodRows, "מוצרים");
            addSheet(sellersRows, "מוכרים");
            addSheet(pendingRows, "עסקאות בהמתנה");
            const dayTag = isAllDays ? "all" : (selectedDays[0]?.name?.replace(/\s/g, "_") ?? String(reportsDayId));
            XLSX.writeFile(wb, `export_${dayTag}_${getFileDateStamp()}.xlsx`, { bookType: "xlsx" });
          };

          return (
          <div style={{ background: "white", borderRadius: "20px", overflow: "hidden" }}>
            {/* ── טאבי דוחות ── */}
            <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", direction: "rtl" }}>
              {([["sales","סקירת מכירות"],["breakdown","פילוחים"],["inventory","סיכום מלאי שנתי"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setReportTab(key)} className="cc-underline-tab"
                  style={underlineTabBtn(reportTab === key)}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* ── בורר יום (משותף לטאבים 1 ו-2) ── */}
              {reportTab !== "inventory" && (
                <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", direction: "rtl" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600 }}>יום מכירה:</label>
                  <select value={isAllDays ? "all" : String(reportsDayId)}
                    onChange={e => setReportsDayId(e.target.value === "all" ? "all" : Number(e.target.value))}
                    style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", minWidth: "220px", direction: "rtl" }}>
                    <option value="all">כל ימי המכירה</option>
                    {activeSaleDay && <option value={String(activeSaleDay.id)}>{activeSaleDay.name} (פעיל)</option>}
                    {saleDays.filter(d => !d.isActive).map(d => (
                      <option key={d.id} value={String(d.id)}>{d.name}{d.date ? ` — ${d.date}` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── סקירת מכירות ── */}
              {reportTab === "sales" && (() => {
                const thR: React.CSSProperties = { padding: "9px 12px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#374151", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
                const tdR: React.CSSProperties = { padding: "8px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" };
                const daily = getDaily();
                const monthly = getMonthly();
                const buildRows = (buckets: Record<string, number>) =>
                  Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0])).map(([key, net]) => {
                    const buckSales = reportEntries.filter(e => {
                      const d = e.transaction.dateISO ? new Date(e.transaction.dateISO) : new Date(e.transaction.date);
                      return (selectedReportType === "daily" ? d.toLocaleDateString("en-GB") : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`) === key;
                    });
                    const sales = buckSales.filter(e => !e.transaction.isReturn);
                    const rets = buckSales.filter(e => e.transaction.isReturn);
                    return { key, salesCount: sales.length, salesAmt: sales.reduce((s, e) => s + e.transaction.finalTotal, 0), retsCount: rets.length, retsAmt: rets.reduce((s, e) => s + e.transaction.finalTotal, 0), net };
                  });
                const rows = buildRows(selectedReportType === "monthly" ? monthly : daily);
                return (
                  <div>
                    {/* כרטיסי סיכום */}
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                      {[
                        { label: "מכירות", value: salesEntries.length, color: "#2563eb" },
                        { label: "סה\"כ גולמי", value: `₪${grossTotal.toFixed(0)}`, color: "#16a34a" },
                        ...(returnsEntries.length > 0 ? [
                          { label: "החזרות", value: returnsEntries.length, color: "#dc2626" },
                          { label: "סה\"כ החזרות", value: `₪${Math.abs(returnsTotal).toFixed(0)}`, color: "#dc2626" },
                          { label: "נטו", value: `₪${netTotal.toFixed(0)}`, color: "#1e40af" },
                        ] : []),
                      ].map(item => (
                        <div key={item.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 18px", textAlign: "center", minWidth: "90px" }}>
                          <div style={{ fontSize: "20px", fontWeight: 800, color: item.color }}>{item.value}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* בורר יומי/חודשי */}
                    <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                      {(["daily","monthly"] as const).map(t => (
                        <button key={t} onClick={() => setSelectedReportType(t)}
                          className="cc-btn" style={{ ...btn(selectedReportType === t ? "primary" : "secondary", "sm") }}>
                          {t === "daily" ? "יומי" : "חודשי"}
                        </button>
                      ))}
                      <button onClick={doExport} className="cc-btn" style={{ ...btn("ghost", "sm"), marginRight: "auto" }}>ייצוא לאקסל</button>
                    </div>
                    {/* טבלה */}
                    {rows.length === 0
                      ? <div style={{ color: "#9ca3af", fontSize: "14px", padding: "24px", textAlign: "center" }}>אין נתונים</div>
                      : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", direction: "rtl" }}>
                            <thead>
                              <tr>
                                <th style={thR}>{selectedReportType === "daily" ? "יום" : "חודש"}</th>
                                <th style={{ ...thR, textAlign: "center" }}>מספר מכירות</th>
                                <th style={{ ...thR, textAlign: "center" }}>סכום מכירות</th>
                                <th style={{ ...thR, textAlign: "center" }}>החזרות</th>
                                <th style={{ ...thR, textAlign: "center" }}>סכום החזרות</th>
                                <th style={{ ...thR, textAlign: "center" }}>סכום נטו</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map(r => (
                                <tr key={r.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ ...tdR, fontWeight: 600 }}>{r.key}</td>
                                  <td style={{ ...tdR, textAlign: "center" }}>{r.salesCount}</td>
                                  <td style={{ ...tdR, textAlign: "center", color: "#16a34a", fontWeight: 600 }}>₪{r.salesAmt.toFixed(0)}</td>
                                  <td style={{ ...tdR, textAlign: "center", color: r.retsCount > 0 ? "#dc2626" : "#9ca3af" }}>{r.retsCount}</td>
                                  <td style={{ ...tdR, textAlign: "center", color: r.retsCount > 0 ? "#dc2626" : "#9ca3af" }}>{r.retsCount > 0 ? `₪${Math.abs(r.retsAmt).toFixed(0)}` : "—"}</td>
                                  <td style={{ ...tdR, textAlign: "center", fontWeight: 700, color: "#1e40af" }}>₪{r.net.toFixed(0)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                                <td style={{ ...tdR, fontWeight: 700 }}>סה"כ</td>
                                <td style={{ ...tdR, textAlign: "center" }}>{rows.reduce((s, r) => s + r.salesCount, 0)}</td>
                                <td style={{ ...tdR, textAlign: "center", color: "#16a34a" }}>₪{rows.reduce((s, r) => s + r.salesAmt, 0).toFixed(0)}</td>
                                <td style={{ ...tdR, textAlign: "center" }}>{rows.reduce((s, r) => s + r.retsCount, 0)}</td>
                                <td style={{ ...tdR, textAlign: "center", color: "#dc2626" }}>₪{Math.abs(rows.reduce((s, r) => s + r.retsAmt, 0)).toFixed(0)}</td>
                                <td style={{ ...tdR, textAlign: "center", color: "#1e40af" }}>₪{rows.reduce((s, r) => s + r.net, 0).toFixed(0)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )
                    }
                  </div>
                );
              })()}

              {/* ── פילוחים ── */}
              {reportTab === "breakdown" && (() => {
                const thB: React.CSSProperties = { padding: "9px 12px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#374151", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" };
                const tdB: React.CSSProperties = { padding: "8px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" };
                const grandNet = netTotal || 1;
                const buildBreakdown = (data: Record<string, number>) =>
                  Object.entries(data)
                    .map(([name, amount]) => ({ name, amount }))
                    .sort((a, b) => b.amount - a.amount);
                const breakdownData =
                  breakdownTab === "category" ? buildBreakdown(getByCategory()) :
                  breakdownTab === "customer" ? buildBreakdown(getByCustomer()) :
                  buildBreakdown(getBySeller());
                const countFor = (name: string) => breakdownTab === "seller"
                  ? reportEntries.filter(e => e.transaction.seller === name).length
                  : breakdownTab === "customer"
                  ? reportEntries.filter(e => e.transaction.customerName === name).length
                  : reportEntries.filter(e => e.saleDay.products?.find(p => p.id === e.transaction.items.find(i => i.name === name)?.id)?.category === name || e.transaction.items.some(i => (e.saleDay.products?.find(p => p.id === i.id)?.category ?? "לא ידוע") === name)).length;
                return (
                  <div>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "16px", direction: "rtl" }}>
                      {([["category","לפי קטגוריה"],["customer","לפי לקוח"],["seller","לפי מוכר"]] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setBreakdownTab(key)}
                          className="cc-btn" style={{ ...btn(breakdownTab === key ? "primary" : "secondary", "sm") }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {breakdownData.length === 0
                      ? <div style={{ color: "#9ca3af", fontSize: "14px", padding: "24px", textAlign: "center" }}>אין נתונים</div>
                      : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", direction: "rtl" }}>
                            <thead>
                              <tr>
                                <th style={thB}>שם</th>
                                <th style={{ ...thB, textAlign: "center" }}>עסקאות</th>
                                <th style={{ ...thB, textAlign: "center" }}>סכום נטו</th>
                                <th style={{ ...thB, textAlign: "center" }}>% מסך המכירות</th>
                              </tr>
                            </thead>
                            <tbody>
                              {breakdownData.map((row, i) => (
                                <tr key={row.name} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                                  <td style={{ ...tdB, fontWeight: 600 }}>{row.name || "—"}</td>
                                  <td style={{ ...tdB, textAlign: "center" }}>{countFor(row.name)}</td>
                                  <td style={{ ...tdB, textAlign: "center", fontWeight: 700, color: "#1e40af" }}>₪{row.amount.toFixed(0)}</td>
                                  <td style={{ ...tdB, textAlign: "center", color: "#6b7280" }}>{((row.amount / grandNet) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    }
                  </div>
                );
              })()}

              {/* ── סיכום מלאי שנתי ── */}
              {reportTab === "inventory" && (() => {
                const thS: React.CSSProperties = { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#374151", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 };
                const tdS: React.CSSProperties = { padding: "8px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" };
                const years = [...new Set(saleDays.map(d => getSaleDayYear(d)))].sort((a, b) => b - a);
                const daysInYear = saleDays.filter(d => getSaleDayYear(d) === inventorySelectedYear);
                type AnnualRow = {
                  key: string; label: string; isLinked: boolean;
                  warehouseCode?: string;
                  required: number; actualIn: number; sold: number; amount: number; remaining: number;
                  byDay: { dayName: string; required: number; actualIn: number; sold: number; amount: number; remaining: number }[];
                };
                const linkedMap = new Map<string, AnnualRow>();
                const unlinkedMap = new Map<number, AnnualRow>();
                daysInYear.forEach(day => {
                  getInventoryForDay(day).forEach(item => {
                    const r = computeInventoryRow(item, day.transactions ?? []);
                    const entry = { dayName: day.name, required: r.requiredQty, actualIn: r.actualInQty, sold: r.soldQty, amount: r.soldAmount, remaining: r.remainingQty };
                    if (item.warehouseCode) {
                      const existing = linkedMap.get(item.warehouseCode);
                      if (existing) {
                        existing.required += r.requiredQty; existing.actualIn += r.actualInQty;
                        existing.sold += r.soldQty; existing.amount += r.soldAmount; existing.remaining += r.remainingQty;
                        existing.byDay.push(entry);
                      } else {
                        const whItem = warehouseItems.find(w => w.code === item.warehouseCode && w.year === inventorySelectedYear);
                        linkedMap.set(item.warehouseCode, {
                          key: `wh:${item.warehouseCode}`, label: whItem?.name ?? item.warehouseCode,
                          isLinked: true, warehouseCode: item.warehouseCode,
                          required: r.requiredQty, actualIn: r.actualInQty, sold: r.soldQty, amount: r.soldAmount, remaining: r.remainingQty,
                          byDay: [entry],
                        });
                      }
                    } else {
                      const existing = unlinkedMap.get(item.productId);
                      if (existing) {
                        existing.required += r.requiredQty; existing.actualIn += r.actualInQty;
                        existing.sold += r.soldQty; existing.amount += r.soldAmount; existing.remaining += r.remainingQty;
                        existing.byDay.push(entry);
                      } else {
                        unlinkedMap.set(item.productId, {
                          key: `pid:${item.productId}`, label: item.productName, isLinked: false,
                          required: r.requiredQty, actualIn: r.actualInQty, sold: r.soldQty, amount: r.soldAmount, remaining: r.remainingQty,
                          byDay: [entry],
                        });
                      }
                    }
                  });
                });
                const allRows = [...linkedMap.values(), ...unlinkedMap.values()];
                return (
                  <div style={{ direction: "rtl" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                      <select value={inventorySelectedYear} onChange={e => setInventorySelectedYear(Number(e.target.value))}
                        style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>{daysInYear.length} ימי מכירה בשנה זו</span>
                      <button onClick={() => exportAnnualInventoryToXlsx(inventorySelectedYear)} className="cc-btn" style={btn("success", "sm")}>
                        ייצא לאקסל
                      </button>
                    </div>
                    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr>
                            <th style={thS}>מוצר / קוד מחסן</th>
                            <th style={{ ...thS, textAlign: "center" }}>סה"כ דרוש</th>
                            <th style={{ ...thS, textAlign: "center" }}>סה"כ נכנס</th>
                            <th style={{ ...thS, textAlign: "center" }}>סה"כ נמכר</th>
                            <th style={{ ...thS, textAlign: "center" }}>סכום נמכר</th>
                            <th style={{ ...thS, textAlign: "center" }}>סה"כ נשאר</th>
                            <th style={{ ...thS, textAlign: "center" }}>פירוט לפי מכירה</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allRows.map(row => (
                            <tr key={row.key} style={{ background: row.isLinked ? "white" : "#fffbeb" }}>
                              <td style={{ ...tdS, fontWeight: 600 }}>
                                {row.label}
                                {row.isLinked && row.warehouseCode && (
                                  <span style={{ marginRight: "6px", fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>({row.warehouseCode})</span>
                                )}
                                {!row.isLinked && (
                                  <span style={{ marginRight: "8px", fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "8px", fontWeight: 400 }}>לא מקושר למחסן</span>
                                )}
                              </td>
                              <td style={{ ...tdS, textAlign: "center" }}>{row.required}</td>
                              <td style={{ ...tdS, textAlign: "center" }}>{row.actualIn}</td>
                              <td style={{ ...tdS, textAlign: "center", color: "#2563eb", fontWeight: 600 }}>{row.sold}</td>
                              <td style={{ ...tdS, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>₪{row.amount.toFixed(2)}</td>
                              <td style={{ ...tdS, textAlign: "center", fontWeight: 700, color: row.remaining < 0 ? "#dc2626" : row.remaining === 0 ? "#6b7280" : "#16a34a" }}>{row.remaining}</td>
                              <td style={{ ...tdS, fontSize: "11px", color: "#6b7280" }}>
                                {row.byDay.map(d => `${d.dayName}: נכנס ${d.actualIn} נמכר ${d.sold} ₪${d.amount.toFixed(0)}`).join(" | ")}
                              </td>
                            </tr>
                          ))}
                          {allRows.length === 0 && (
                            <tr><td colSpan={7} style={{ ...tdS, textAlign: "center", color: "#9ca3af", padding: "24px" }}>אין נתוני מלאי לשנה זו</td></tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: "#f8fafc" }}>
                            <td style={{ ...tdS, fontWeight: 700 }}>סה"כ</td>
                            <td style={{ ...tdS, textAlign: "center", fontWeight: 700 }}>{allRows.reduce((s, r) => s + r.required, 0)}</td>
                            <td style={{ ...tdS, textAlign: "center", fontWeight: 700 }}>{allRows.reduce((s, r) => s + r.actualIn, 0)}</td>
                            <td style={{ ...tdS, textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{allRows.reduce((s, r) => s + r.sold, 0)}</td>
                            <td style={{ ...tdS, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>₪{allRows.reduce((s, r) => s + r.amount, 0).toFixed(2)}</td>
                            <td style={{ ...tdS, textAlign: "center", fontWeight: 700 }}>{allRows.reduce((s, r) => s + r.remaining, 0)}</td>
                            <td style={tdS}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          );
        })()}

        {!cashierMode && adminTab === "inventory" && inventoryAdminTab === "inventory" && (() => {
          const selectedDay = inventorySelectedDayId ? saleDays.find(d => d.id === inventorySelectedDayId) : null;
          const years = [...new Set(saleDays.map(d => getSaleDayYear(d)))].sort((a, b) => b - a);
          const daysInYear = saleDays.filter(d => getSaleDayYear(d) === inventorySelectedYear);

          const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#374151", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 };
          const tdStyle: React.CSSProperties = { padding: "8px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" };
          const inputNum = (val: number, onChange: (v: number) => void): React.ReactNode =>
            <input type="number" min={0} value={val || ""} onChange={e => onChange(Number(e.target.value) || 0)}
              onWheel={e => (e.target as HTMLElement).blur()}
              style={{ width: "70px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", textAlign: "center" }} />;

          // שורות מחושבות ליום הנבחר (מחושב פעם אחת, משמש בכל השלבים)
          const isPreorderDay = selectedDay?.type === "preorder";
          const dayRows = selectedDay ? (() => {
            const inv = getInventoryForDay(selectedDay);
            const txs = selectedDay.transactions ?? [];
            return inv.map(item => computeInventoryRow(item, txs, isPreorderDay ? (selectedDay.preOrders ?? []) : undefined));
          })() : [];

          const noDay = (
            <div style={{ color: "#9ca3af", textAlign: "center", padding: "32px", background: "#f8fafc", borderRadius: "12px" }}>
              לא נבחר יום מכירה — עבור לשלב "בחירת יום"
            </div>
          );

          const stepDefs: Array<{ key: typeof inventoryStep; label: string }> = [
            { key: "select",   label: "בחירת יום" },
            { key: "planning", label: "תכנון כמויות" },
            { key: "packing",  label: "עדכון אריזה" },
            { key: "live",     label: "מצב מכירה" },
            { key: "closing",  label: "סגירת מלאי" },
          ];

          return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, gap: "16px" }}>

              {/* ── HEADER: title + segmented control + description ── */}
              <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111827" }}>מלאי ומחסן</h2>
                  {/* Segmented control */}
                  <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
                    <button onClick={() => setInventoryAdminTab("inventory")} className="cc-tab" style={tabBtn(true)}>
                      מלאי יום מכירה
                    </button>
                    <button onClick={() => setInventoryAdminTab("warehouse")} className="cc-tab" style={tabBtn(false)}>
                      מחסן מרכזי
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                  תכנון, אריזה, מעקב וספירה לכל מכירה.
                </p>
                {/* Day info bar */}
                {selectedDay && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 700 }}>{selectedDay.name}</span>
                    <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: "8px", padding: "4px 10px", fontSize: "12px" }}>{formatDateIL(selectedDay.date)}</span>
                    <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: "8px", padding: "4px 10px", fontSize: "12px" }}>
                      {selectedDay.type === "walkin" ? "לקוחות עם הנחה" : selectedDay.type === "walkin-nodiscount" ? "ללא הנחה" : selectedDay.type === "preorder" ? "הזמנות" : "פתוח"}
                    </span>
                    <span style={{ background: selectedDay.isActive ? "#dcfce7" : "#f1f5f9", color: selectedDay.isActive ? "#16a34a" : "#6b7280", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 700 }}>
                      {selectedDay.isActive ? "● פעיל" : "לא פעיל"}
                    </span>
                  </div>
                )}
              </div>

              {/* ── PANEL: stepper + content ── */}
              <div style={{ background: "white", borderRadius: "20px", flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Stepper */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: "0", alignItems: "center" }}>
                    {stepDefs.map((s, i) => {
                      const curIdx = stepDefs.findIndex(x => x.key === inventoryStep);
                      const done = i < curIdx;
                      const active = i === curIdx;
                      const disabled = s.key !== "select" && !selectedDay;
                      return (
                        <React.Fragment key={s.key}>
                          <button
                            onClick={() => !disabled && setInventoryStep(s.key)}
                            disabled={disabled}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "transparent", border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, borderRadius: "10px", transition: "background 0.15s" }}
                          >
                            <span style={{
                              width: "28px", height: "28px", borderRadius: "50%", display: "flex",
                              alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700,
                              flexShrink: 0,
                              background: done ? "#dcfce7" : active ? "#2563eb" : "#f1f5f9",
                              color: done ? "#16a34a" : active ? "white" : "#9ca3af",
                              border: active ? "2px solid #2563eb" : "2px solid transparent",
                            }}>
                              {done ? "✓" : i + 1}
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "#1d4ed8" : done ? "#374151" : "#6b7280", whiteSpace: "nowrap" as const }}>
                              {s.label}
                            </span>
                          </button>
                          {i < stepDefs.length - 1 && (
                            <div style={{ flex: 1, height: "1px", background: i < curIdx ? "#bbf7d0" : "#e2e8f0", minWidth: "12px" }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Step content — scrollable */}
                <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>

                  {/* ════ שלב 1: בחירת יום ════ */}
                  {inventoryStep === "select" && (
                    <div style={{ padding: "20px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>יום מכירה</label>
                        <select value={inventorySelectedDayId ?? ""} onChange={e => setInventorySelectedDayId(Number(e.target.value) || null)}
                          style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", minWidth: "240px" }}>
                          <option value="">— בחר יום מכירה —</option>
                          {[...saleDays]
                            .sort((a, b) => {
                              if (a.isActive && !b.isActive) return -1;
                              if (!a.isActive && b.isActive) return 1;
                              return b.id - a.id;
                            })
                            .map(d => (
                              <option key={d.id} value={d.id}>
                                {d.isActive ? "● " : ""}{d.name} ({formatDateIL(d.date)})
                              </option>
                            ))}
                        </select>
                        {selectedDay && (
                          <button onClick={() => setInventoryStep("planning")} className="cc-btn" style={btn("primary")}>
                            המשך לתכנון ←
                          </button>
                        )}
                      </div>
                      {selectedDay ? (() => {
                        const totalRequired = dayRows.reduce((s, r) => s + r.requiredQty, 0);
                        const totalPacked = dayRows.reduce((s, r) => s + r.actualInQty, 0);
                        const totalShortage = dayRows.reduce((s, r) => s + r.shortageQty, 0);
                        const totalReserved = isPreorderDay ? dayRows.reduce((s, r) => s + (r.reservedQty ?? 0), 0) : null;
                        const totalAvailable = isPreorderDay ? dayRows.reduce((s, r) => s + (r.availableQty ?? 0), 0) : null;
                        const cards: Array<{ label: string; value: number | string; color: string; tooltip?: string }> = [
                          { label: "מוצרים", value: dayRows.length, color: "#374151" },
                          { label: "כמות דרושה", value: totalRequired, color: "#374151" },
                          { label: "נארז", value: totalPacked, color: totalPacked >= totalRequired && totalRequired > 0 ? "#16a34a" : "#374151" },
                          { label: "חסר", value: totalShortage, color: totalShortage > 0 ? "#dc2626" : "#16a34a" },
                          ...(isPreorderDay ? [
                            { label: "שמור להזמנות", value: totalReserved!, color: "#7c3aed", tooltip: "כמות שנשמרת עבור הזמנות שאושרו" },
                            { label: "פנוי למכירה", value: totalAvailable!, color: (totalAvailable ?? 0) > 0 ? "#0891b2" : "#374151", tooltip: "כמות שנארזה פחות הכמות השמורה להזמנות" },
                          ] : []),
                        ];
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                            {cards.map(card => (
                              <div key={card.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", textAlign: "center", border: "1px solid #e2e8f0" }} title={card.tooltip ?? ""}>
                                <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" as const }}>{card.label}{card.tooltip ? " ℹ" : ""}</div>
                                <div style={{ fontSize: "26px", fontWeight: 800, color: card.color }}>{card.value}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })() : (
                        <div style={{ color: "#9ca3af", textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "12px", fontSize: "14px" }}>
                          בחר יום מכירה להתחלה
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════ שלב 2: תכנון כמויות ════ */}
                  {inventoryStep === "planning" && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      {!selectedDay ? <div style={{ padding: "20px" }}>{noDay}</div> : (() => {
                        const dayYear = new Date(selectedDay.id).getFullYear();
                        const whOptions = warehouseItems.filter(w => w.year === dayYear);
                        const filtered2 = dayRows.filter(row => {
                          if (planningSearch && !row.productName.toLowerCase().includes(planningSearch.toLowerCase())) return false;
                          if (planningFilter === "unlinked") return !row.warehouseCode && whOptions.length > 0;
                          if (planningFilter === "gap") {
                            const diff = (row.plannedQty ?? 0) - row.requiredQty;
                            return row.plannedQty != null && diff !== 0;
                          }
                          return true;
                        });
                        return (
                          <>
                            {/* Toolbar */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, direction: "rtl" }}>
                              <input placeholder="חיפוש מוצר..." value={planningSearch} onChange={e => setPlanningSearch(e.target.value)}
                                style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", flex: "1 1 160px" }} />
                              {(["all", "unlinked", "gap"] as const).map(f => (
                                <button key={f} onClick={() => setPlanningFilter(f)} className="cc-btn"
                                  style={btn(planningFilter === f ? "primary" : "secondary", "sm")}>
                                  {f === "all" ? "הכול" : f === "unlinked" ? "לא מקושר למחסן" : "קיים פער"}
                                </button>
                              ))}
                              {selectedDay.type === "preorder" && (
                                <button onClick={() => syncPreorderRequiredQty(selectedDay)} className="cc-btn" style={btn("teal", "sm")}>
                                  ↻ סנכרן מהזמנות
                                </button>
                              )}
                              {selectedDay.type !== "preorder" && (() => {
                                const lastYear = getLastYearDay(selectedDay);
                                return (
                                  <>
                                    <button onClick={() => fillRequiredFromLastYear(selectedDay)} className="cc-btn" style={btn("purple", "sm")}>
                                      {lastYear ? `↻ מלא דרוש משנה ${new Date(lastYear.id).getFullYear()}` : "↻ ייבא מאקסל שנה שעברה"}
                                    </button>
                                    <input ref={lastYearFileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
                                      onChange={e => { const f = e.target.files?.[0]; if (f) importLastYearFromXlsx(selectedDay, f); e.target.value = ""; }} />
                                  </>
                                );
                              })()}
                              <span style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" as const }}>נשמר אוטומטית</span>
                              <button onClick={() => setInventoryStep("packing")} className="cc-btn" style={btn("primary", "sm")}>
                                המשך לאריזה ←
                              </button>
                            </div>
                            {/* Table */}
                            <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...thStyle, textAlign: "center" }}>מוצר</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>קוד/מוצר מחסן</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>כמות דרושה</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>כמות לאריזה</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>פער</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>מצב</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filtered2.map(row => {
                                    const planned = row.plannedQty ?? 0;
                                    const diff = planned - row.requiredQty;
                                    const isUnlinked = !row.warehouseCode && whOptions.length > 0;
                                    return (
                                      <tr key={row.productId} style={{ background: isUnlinked ? "#fffbeb" : "white" }}>
                                        <td style={{ ...thStyle, background: "white", fontWeight: 600, textAlign: "right", position: "static" as const }}>{row.productName}</td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          <select
                                            value={row.warehouseCode ?? ""}
                                            onChange={e => updateInventoryWarehouseCode(selectedDay.id, row.productId, e.target.value)}
                                            style={{ padding: "4px 6px", borderRadius: "6px", border: row.warehouseCode ? "1px solid #0891b2" : "1px solid #e2e8f0", fontSize: "12px", background: row.warehouseCode ? "#f0f9ff" : "#fafafa", minWidth: "120px" }}>
                                            <option value="">— ללא קישור —</option>
                                            {whOptions.map(w => <option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}
                                          </select>
                                          {isUnlinked && (
                                            <div style={{ fontSize: "11px", color: "#d97706", marginTop: "2px" }}>לא מקושר למחסן</div>
                                          )}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700 }}>{row.requiredQty}</td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          {inputNum(planned, v => updateInventoryField(selectedDay.id, row.productId, "plannedQty", v))}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700,
                                          color: row.plannedQty == null ? "#9ca3af" : diff === 0 ? "#6b7280" : diff > 0 ? "#0891b2" : "#dc2626" }}>
                                          {row.plannedQty == null ? "—" : diff === 0 ? "—" : diff > 0 ? `+${diff}` : diff}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          {isUnlinked ? (
                                            <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>לא מקושר</span>
                                          ) : row.plannedQty == null ? (
                                            <span style={{ color: "#9ca3af", fontSize: "11px" }}>—</span>
                                          ) : diff === 0 ? (
                                            <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>תקין</span>
                                          ) : diff > 0 ? (
                                            <span style={{ background: "#e0f2fe", color: "#0891b2", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>עודף</span>
                                          ) : (
                                            <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>חסר</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {filtered2.length === 0 && (
                                    <tr><td colSpan={6} style={{ ...thStyle, background: "white", textAlign: "center", color: "#9ca3af", padding: "32px", position: "static" as const }}>
                                      {dayRows.length === 0 ? "אין מוצרים ביום זה" : "אין תוצאות לפי הסינון הנוכחי"}
                                    </td></tr>
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr style={{ background: "#f8fafc" }}>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, fontWeight: 700 }}>סה"כ</td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const }}></td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.requiredQty, 0)}</td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + (r.plannedQty ?? 0), 0)}</td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700 }}>
                                      {(() => { const t = dayRows.filter(r => r.plannedQty != null).reduce((s, r) => s + (r.plannedQty ?? 0) - r.requiredQty, 0); return t === 0 ? "—" : t > 0 ? `+${t}` : t; })()}
                                    </td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const }}></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* ════ שלב 3: עדכון אריזה ════ */}
                  {inventoryStep === "packing" && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      {!selectedDay ? <div style={{ padding: "20px" }}>{noDay}</div> : (() => {
                        const inv = getInventoryForDay(selectedDay);
                        const updatedCount = dayRows.filter(r => r.actualInQty > 0 || (r.plannedQty ?? 0) > 0 && r.actualInQty === 0).length;
                        const filteredPacking = dayRows.filter(row => {
                          if (packingSearch && !row.productName.toLowerCase().includes(packingSearch.toLowerCase())) return false;
                          const planned = row.plannedQty ?? 0;
                          const diff = row.actualInQty - planned;
                          const hasData = planned > 0 || row.actualInQty > 0;
                          if (packingFilter === "ok") return hasData && diff === 0;
                          if (packingFilter === "missing") return hasData && diff < 0;
                          if (packingFilter === "excess") return hasData && diff > 0;
                          if (packingFilter === "pending") return !hasData;
                          return true;
                        });
                        return (
                          <>
                            {/* Toolbar */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, direction: "rtl" }}>
                              <input placeholder="חיפוש מוצר..." value={packingSearch} onChange={e => setPackingSearch(e.target.value)}
                                style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", flex: "1 1 160px" }} />
                              {(["all", "ok", "missing", "excess", "pending"] as const).map(f => (
                                <button key={f} onClick={() => setPackingFilter(f)} className="cc-btn"
                                  style={btn(packingFilter === f ? "primary" : "secondary", "sm")}>
                                  {f === "all" ? "הכול" : f === "ok" ? "תקין" : f === "missing" ? "חסר" : f === "excess" ? "עודף" : "טרם עודכן"}
                                </button>
                              ))}
                              <span style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" as const }}>
                                {updatedCount} מתוך {dayRows.length} עודכנו
                              </span>
                              <button onClick={() => setInventoryStep("live")} className="cc-btn" style={btn("primary", "sm")}>
                                המשך למכירה ←
                              </button>
                            </div>
                            {/* Table */}
                            <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...thStyle, textAlign: "center" }}>מוצר</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>כמות לאריזה</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>כמות שנארזה</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>פער</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>סטטוס</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredPacking.map(row => {
                                    const planned = row.plannedQty ?? 0;
                                    const diff = row.actualInQty - planned;
                                    const hasData = planned > 0 || row.actualInQty > 0;
                                    const status = !hasData ? null
                                      : diff < 0 ? { label: "חסר", color: "#dc2626", bg: "#fee2e2" }
                                      : diff === 0 ? { label: "תקין", color: "#16a34a", bg: "#dcfce7" }
                                      : { label: "עודף", color: "#0891b2", bg: "#e0f2fe" };
                                    return (
                                      <tr key={row.productId}>
                                        <td style={{ ...thStyle, background: "white", fontWeight: 600, textAlign: "right", position: "static" as const }}>{row.productName}</td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 600, color: planned === 0 ? "#9ca3af" : "#374151" }}>
                                          {planned === 0 ? "—" : planned}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          {inputNum(row.actualInQty, v => updateInventoryField(selectedDay.id, row.productId, "actualInQty", v))}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700,
                                          color: !hasData ? "#9ca3af" : diff === 0 ? "#6b7280" : diff > 0 ? "#0891b2" : "#dc2626" }}>
                                          {!hasData ? "—" : diff === 0 ? "—" : diff > 0 ? `+${diff}` : diff}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          {status ? (
                                            <span style={{ background: status.bg, color: status.color, padding: "3px 10px", borderRadius: "20px", fontWeight: 700, fontSize: "12px" }}>
                                              {status.label}
                                            </span>
                                          ) : (
                                            <span style={{ background: "#f1f5f9", color: "#9ca3af", padding: "3px 10px", borderRadius: "20px", fontSize: "12px" }}>טרם עודכן</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {filteredPacking.length === 0 && inv.length === 0 && (
                                    <tr><td colSpan={5} style={{ ...thStyle, background: "white", textAlign: "center", color: "#9ca3af", padding: "32px", position: "static" as const }}>אין מוצרים ביום זה</td></tr>
                                  )}
                                  {filteredPacking.length === 0 && inv.length > 0 && (
                                    <tr><td colSpan={5} style={{ ...thStyle, background: "white", textAlign: "center", color: "#9ca3af", padding: "32px", position: "static" as const }}>אין תוצאות לפי הסינון הנוכחי</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* ════ שלב 4: מצב מכירה ════ */}
                  {inventoryStep === "live" && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      {!selectedDay ? <div style={{ padding: "20px" }}>{noDay}</div> : (() => {
                        const liveFiltered = dayRows.filter(row => {
                          if (liveSearch && !row.productName.toLowerCase().includes(liveSearch.toLowerCase())) return false;
                          return true;
                        });
                        const totalPacked = dayRows.reduce((s, r) => s + r.actualInQty, 0);
                        const totalSold = dayRows.reduce((s, r) => s + r.soldQty, 0);
                        const totalReserved = isPreorderDay ? dayRows.reduce((s, r) => s + (r.reservedQty ?? 0), 0) : null;
                        const totalAvailable = isPreorderDay ? dayRows.reduce((s, r) => s + (r.availableQty ?? 0), 0) : null;
                        const totalSalesAmt = dayRows.reduce((s, r) => s + r.soldAmount, 0);
                        return (
                          <>
                            {/* Summary cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", padding: "14px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
                              {([
                                { label: "נארז", value: totalPacked, color: "#374151" },
                                { label: "נמכר", value: totalSold, color: "#2563eb" },
                                ...(isPreorderDay ? [
                                  { label: "שמור להזמנות", value: totalReserved!, color: "#7c3aed" },
                                  { label: "פנוי", value: totalAvailable!, color: "#0891b2" },
                                ] : []),
                                { label: "סכום מכירות", value: formatCurrency(totalSalesAmt), color: "#16a34a" },
                              ] as Array<{ label: string; value: number | string; color: string }>).map(c => (
                                <div key={c.label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 14px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "4px", fontWeight: 600 }}>{c.label}</div>
                                  <div style={{ fontSize: "18px", fontWeight: 800, color: c.color, direction: "ltr" }}>{c.value}</div>
                                </div>
                              ))}
                            </div>
                            {/* Toolbar */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0 }}>
                              <input placeholder="חיפוש מוצר..." value={liveSearch} onChange={e => setLiveSearch(e.target.value)}
                                style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", flex: "1 1 160px" }} />
                              <button onClick={() => setInventoryStep("closing")} className="cc-btn" style={btn("primary", "sm")}>
                                עבור לסגירת מלאי ←
                              </button>
                            </div>
                            {/* Table */}
                            <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...thStyle, textAlign: "center" }}>מוצר</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>נארז</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>נמכר</th>
                                    {isPreorderDay && <th style={{ ...thStyle, textAlign: "center" }}>שמור</th>}
                                    {isPreorderDay && <th style={{ ...thStyle, textAlign: "center" }}>פנוי</th>}
                                    <th style={{ ...thStyle, textAlign: "center" }}>נשאר</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>סכום נמכר</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {liveFiltered.map(row => (
                                    <tr key={row.productId}>
                                      <td style={{ ...thStyle, background: "white", fontWeight: 600, textAlign: "right", position: "static" as const }}>{row.productName}</td>
                                      <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>{row.actualInQty}</td>
                                      <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700, color: "#2563eb" }}>{row.soldQty}</td>
                                      {isPreorderDay && <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700, color: (row.reservedQty ?? 0) > 0 ? "#7c3aed" : "#6b7280" }}>{row.reservedQty ?? 0}</td>}
                                      {isPreorderDay && <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700, color: (row.availableQty ?? 0) > 0 ? "#0891b2" : "#374151" }}>{row.availableQty ?? 0}</td>}
                                      <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700, color: row.remainingQty < 0 ? "#dc2626" : row.remainingQty === 0 ? "#6b7280" : "#16a34a" }}>
                                        {row.remainingQty}
                                      </td>
                                      <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700, color: "#16a34a" }}>
                                        <span dir="ltr">{formatCurrency(row.soldAmount)}</span>
                                      </td>
                                    </tr>
                                  ))}
                                  {liveFiltered.length === 0 && (
                                    <tr><td colSpan={isPreorderDay ? 7 : 5} style={{ ...thStyle, background: "white", textAlign: "center", color: "#9ca3af", padding: "32px", position: "static" as const }}>
                                      {dayRows.length === 0 ? "אין מוצרים ביום זה" : "אין תוצאות"}
                                    </td></tr>
                                  )}
                                </tbody>
                                <tfoot>
                                  <tr style={{ background: "#f8fafc" }}>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, fontWeight: 700 }}>סה"כ</td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700 }}>{totalPacked}</td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{totalSold}</td>
                                    {isPreorderDay && <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{totalReserved}</td>}
                                    {isPreorderDay && <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>{totalAvailable}</td>}
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.remainingQty, 0)}</td>
                                    <td style={{ ...thStyle, background: "#f8fafc", position: "static" as const, textAlign: "center", fontWeight: 700, color: "#16a34a" }}>
                                      <span dir="ltr">{formatCurrency(totalSalesAmt)}</span>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* ════ שלב 5: סגירת מלאי ════ */}
                  {inventoryStep === "closing" && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                      {!selectedDay ? <div style={{ padding: "20px" }}>{noDay}</div> : (() => {
                        const hasEndQty = dayRows.some(r => r.actualEndQty != null);
                        const countedRows = dayRows.filter(r => r.actualEndQty != null);
                        const uncountedRows = dayRows.filter(r => r.actualEndQty == null);
                        const deviationRows = dayRows.filter(r => r.varianceQty != null && r.varianceQty !== 0);
                        const filteredClosing = dayRows.filter(row => {
                          if (closingSearch && !row.productName.toLowerCase().includes(closingSearch.toLowerCase())) return false;
                          if (closingFilter === "uncounted") return row.actualEndQty == null;
                          if (closingFilter === "variance") return row.varianceQty != null && row.varianceQty !== 0;
                          return true;
                        });
                        return (
                          <>
                            {/* Summary chips */}
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "14px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0, alignItems: "center" }}>
                              <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", fontWeight: 700 }}>
                                ✓ {countedRows.length} נספרו
                              </span>
                              <span style={{ background: uncountedRows.length > 0 ? "#fef3c7" : "#f1f5f9", color: uncountedRows.length > 0 ? "#92400e" : "#6b7280", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", fontWeight: 700 }}>
                                {uncountedRows.length} טרם נספרו
                              </span>
                              {deviationRows.length > 0 && (
                                <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", fontWeight: 700 }}>
                                  ⚠ {deviationRows.length} עם סטייה
                                </span>
                              )}
                            </div>
                            {/* Toolbar */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0 }}>
                              <input placeholder="חיפוש מוצר..." value={closingSearch} onChange={e => setClosingSearch(e.target.value)}
                                style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", flex: "1 1 160px" }} />
                              {(["all", "uncounted", "variance"] as const).map(f => (
                                <button key={f} onClick={() => setClosingFilter(f)} className="cc-btn"
                                  style={btn(closingFilter === f ? "primary" : "secondary", "sm")}>
                                  {f === "all" ? "הכול" : f === "uncounted" ? "טרם נספרו" : "עם סטייה"}
                                </button>
                              ))}
                              <button onClick={() => exportInventoryToXlsx(selectedDay)} className="cc-btn" style={btn("secondary", "sm")}>
                                ↓ ייצא לאקסל
                              </button>
                              <button onClick={() => showConfirm({
                                title: "סגירת מלאי",
                                message: `${countedRows.length} מוצרים נספרו${uncountedRows.length > 0 ? `, ${uncountedRows.length} טרם נספרו` : ""}${deviationRows.length > 0 ? `, ${deviationRows.length} עם סטייה` : ""}. לסגור את המלאי?`,
                                confirmLabel: "שמור וסגור מלאי",
                                confirmVariant: "success",
                                onConfirm: () => exportInventoryToXlsx(selectedDay),
                              })} className="cc-btn" style={btn("primary", "sm")}>
                                שמור וסגור מלאי
                              </button>
                            </div>
                            {/* Table */}
                            <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr>
                                    <th style={{ ...thStyle, textAlign: "center" }}>מוצר</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>יתרה צפויה</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>נספר בפועל</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>סטייה</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>מצב</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredClosing.map(row => {
                                    const variance = row.varianceQty;
                                    const isCounted = row.actualEndQty != null;
                                    return (
                                      <tr key={row.productId}>
                                        <td style={{ ...thStyle, background: "white", fontWeight: 600, textAlign: "right", position: "static" as const }}>{row.productName}</td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700, color: row.remainingQty < 0 ? "#dc2626" : "#374151" }}>
                                          {row.remainingQty}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          <input type="number" min={0}
                                            value={row.actualEndQty ?? ""}
                                            onChange={e => updateInventoryField(selectedDay.id, row.productId, "actualEndQty", Number(e.target.value) || 0)}
                                            placeholder="—"
                                            style={{ width: "70px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #0d9488", fontSize: "13px", textAlign: "center" }} />
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const, fontWeight: 700,
                                          color: variance == null ? "#9ca3af" : variance > 0 ? "#16a34a" : variance < 0 ? "#dc2626" : "#6b7280" }}>
                                          {variance == null ? "—" : variance > 0 ? `+${variance}` : variance}
                                        </td>
                                        <td style={{ ...thStyle, background: "white", textAlign: "center", position: "static" as const }}>
                                          {!isCounted ? (
                                            <span style={{ background: "#f1f5f9", color: "#9ca3af", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 600 }}>טרם נספר</span>
                                          ) : variance === 0 ? (
                                            <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>תקין</span>
                                          ) : variance! > 0 ? (
                                            <span style={{ background: "#e0f2fe", color: "#0891b2", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>עודף</span>
                                          ) : (
                                            <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: "8px", padding: "3px 8px", fontSize: "11px", fontWeight: 700 }}>סטייה</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {filteredClosing.length === 0 && (
                                    <tr><td colSpan={5} style={{ ...thStyle, background: "white", textAlign: "center", color: "#9ca3af", padding: "32px", position: "static" as const }}>
                                      {dayRows.length === 0 ? "אין מוצרים ביום זה" : "אין תוצאות לפי הסינון הנוכחי"}
                                    </td></tr>
                                  )}
                                </tbody>
                                {hasEndQty && (
                                  <tfoot>
                                    <tr style={{ background: "#f0fdfa" }}>
                                      <td style={{ ...thStyle, background: "#f0fdfa", position: "static" as const, fontWeight: 700 }}>סה"כ</td>
                                      <td style={{ ...thStyle, background: "#f0fdfa", position: "static" as const, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.remainingQty, 0)}</td>
                                      <td style={{ ...thStyle, background: "#f0fdfa", position: "static" as const, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + (r.actualEndQty ?? 0), 0)}</td>
                                      <td style={{ ...thStyle, background: "#f0fdfa", position: "static" as const, textAlign: "center", fontWeight: 700,
                                        color: (() => { const t = dayRows.filter(r => r.varianceQty != null).reduce((s, r) => s + (r.varianceQty ?? 0), 0); return t > 0 ? "#16a34a" : t < 0 ? "#dc2626" : "#6b7280"; })() }}>
                                        {(() => { const t = dayRows.filter(r => r.varianceQty != null).reduce((s, r) => s + (r.varianceQty ?? 0), 0); return t > 0 ? `+${t}` : t === 0 && dayRows.some(r => r.varianceQty != null) ? "0" : "—"; })()}
                                      </td>
                                      <td style={{ ...thStyle, background: "#f0fdfa", position: "static" as const }}></td>
                                    </tr>
                                  </tfoot>
                                )}
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                </div>{/* /step content */}
              </div>{/* /panel */}
            </div>
          );
        })()}

        {!cashierMode && adminTab === "inventory" && inventoryAdminTab === "warehouse" && (() => {
          const yearOptions = [...new Set([
            ...warehouseItems.map(w => w.year),
            new Date().getFullYear(),
          ])].sort((a, b) => b - a);
          const summaryRows = getWarehouseSummary(warehouseYear);
          const detailItem = warehouseDetailCode != null ? summaryRows.find(r => r.code === warehouseDetailCode) ?? null : null;
          const thSt: React.CSSProperties = { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#374151", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 };
          const tdSt: React.CSSProperties = { padding: "8px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" };
          const inpSt: React.CSSProperties = { padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", width: "100%", boxSizing: "border-box" };

          return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, gap: "16px" }}>

              {/* ── HEADER ── */}
              <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111827" }}>מלאי ומחסן</h2>
                  {/* Segmented control */}
                  <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
                    <button onClick={() => setInventoryAdminTab("inventory")} className="cc-tab" style={tabBtn(false)}>
                      מלאי יום מכירה
                    </button>
                    <button onClick={() => setInventoryAdminTab("warehouse")} className="cc-tab" style={tabBtn(true)}>
                      מחסן מרכזי
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                  רכש, ספקים והיתרות הכוללות.
                </p>
              </div>

              {/* ── WAREHOUSE PANEL ── */}
              <div style={{ background: "white", borderRadius: "20px", flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Sub-header: Products/Suppliers tabs + year + actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0, flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "4px" }}>
                    {(["items", "suppliers"] as const).map(v => (
                      <button key={v} onClick={() => setWarehouseView(v)}
                        className="cc-tab" style={tabBtn(warehouseView === v)}>
                        {v === "items" ? "מוצרים" : "ספקים"}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <select value={warehouseYear} onChange={e => setWarehouseYear(Number(e.target.value))}
                      style={{ padding: "7px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {!warehouseFormVisible && warehouseView === "items" && (
                      <button onClick={() => setWarehouseFormVisible(true)} className="cc-btn" style={btn("primary", "sm")}>
                        + הוסף מוצר מחסן
                      </button>
                    )}
                    <button onClick={() => exportWarehouseToXlsx(warehouseYear)} className="cc-btn" style={btn("secondary", "sm")}>
                      ↓ ייצוא לאקסל
                    </button>
                  </div>
                </div>

                {/* Add/Edit form */}
                {warehouseFormVisible && (
                  <div style={{ background: "#f8fafc", padding: "20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>{warehouseEditId != null ? "עריכת מוצר מחסן" : "הוספת מוצר מחסן"}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>קוד מוצר *</label>
                        <input value={whCode} onChange={e => setWhCode(e.target.value.toUpperCase())} placeholder="לדוגמה: CHOCO-500" style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>שם מוצר *</label>
                        <input value={whName} onChange={e => setWhName(e.target.value)} placeholder="שם המוצר במחסן" style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>יתרת פתיחה</label>
                        <input type="number" min={0} value={whOpeningQty} onChange={e => setWhOpeningQty(e.target.value)} style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>כניסות למחסן</label>
                        <input type="number" min={0} value={whAddedQty} onChange={e => setWhAddedQty(e.target.value)} style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>תיקון מלאי</label>
                        <input type="number" value={whAdjQty} onChange={e => setWhAdjQty(e.target.value)} style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>ספק</label>
                        <input value={whSupplier} onChange={e => setWhSupplier(e.target.value)} placeholder="שם הספק" style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>מחיר עלות ליחידה (₪)</label>
                        <input type="number" min={0} value={whCostPrice} onChange={e => setWhCostPrice(e.target.value)} placeholder="0.00" style={inpSt} /></div>
                      <div><label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>הערות</label>
                        <input value={whNotes} onChange={e => setWhNotes(e.target.value)} style={inpSt} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button onClick={saveWarehouseItem} className="cc-btn" style={btn("primary", "sm")}>
                        {warehouseEditId != null ? "שמור שינויים" : "הוסף"}
                      </button>
                      <button onClick={clearWarehouseForm} className="cc-btn" style={btn("secondary", "sm")}>ביטול</button>
                    </div>
                  </div>
                )}

                {/* Content area */}
                <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

                  {/* ── SUPPLIERS view ── */}
                  {warehouseView === "suppliers" && (() => {
                    const supplierRows = getSupplierReport(warehouseYear);
                    return (
                      <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto", padding: "16px 20px" }}>
                        {supplierRows.length === 0 && (
                          <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px" }}>אין מוצרים עם ספק מוגדר לשנה {warehouseYear}</div>
                        )}
                        {supplierRows.map(s => {
                          const isCollapsed = collapsedSuppliers.has(s.supplier);
                          const toggleCollapse = () => setCollapsedSuppliers(prev => { const next = new Set(prev); if (next.has(s.supplier)) next.delete(s.supplier); else next.add(s.supplier); return next; });
                          return (
                            <div key={s.supplier} style={{ marginBottom: "20px", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                              {/* Accordion header — light, not heavy blue */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isCollapsed ? "#f8fafc" : "#eff6ff", padding: "12px 16px", cursor: "pointer", borderBottom: isCollapsed ? "none" : "1px solid #e2e8f0" }}
                                onClick={toggleCollapse}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span style={{ fontSize: "14px", color: "#374151" }}>{isCollapsed ? "▶" : "▼"}</span>
                                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#1d4ed8" }}>{s.supplier}</span>
                                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{s.products.length} מוצרים</span>
                                </div>
                                <div style={{ display: "flex", gap: "14px", fontSize: "13px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                  <span>עלות רכישה: <strong style={{ color: "#dc2626", direction: "ltr", unicodeBidi: "isolate" }}>{formatCurrency(s.totalCost)}</strong></span>
                                  <span>הכנסות: <strong style={{ color: "#16a34a", direction: "ltr", unicodeBidi: "isolate" }}>{formatCurrency(s.totalSoldAmount)}</strong></span>
                                  <span>רווח גולמי ממומש: <strong style={{ color: s.totalGrossProfit >= 0 ? "#7c3aed" : "#dc2626", direction: "ltr", unicodeBidi: "isolate" }}>{formatCurrency(s.totalGrossProfit)}</strong></span>
                                  <span>ערך מלאי שנותר: <strong style={{ color: "#0891b2", direction: "ltr", unicodeBidi: "isolate" }}>{formatCurrency(s.totalRemainingValue)}</strong></span>
                                </div>
                              </div>
                              {/* Accordion body */}
                              {!isCollapsed && (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                  <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>מוצר</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>כמות שנרכשה</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>עלות ליחידה</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>עלות רכישה כוללת</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>כמות שנמכרה</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>הכנסות ממכירות</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>עלות המכר</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>רווח גולמי ממומש</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>כמות שנותרה</th>
                                      <th style={{ ...thSt, textAlign: "center", position: "static" as const }}>ערך מלאי שנותר</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {s.products.map(p => (
                                      <tr key={p.code} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={tdSt}>
                                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                                          <div style={{ fontSize: "11px", color: "#9ca3af" }}>{p.code}</div>
                                        </td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>{p.receivedQty}</td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>
                                          {p.costPrice > 0 ? <span dir="ltr">{formatCurrency(p.costPrice)}</span> : "—"}
                                        </td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>
                                          {p.totalCost > 0 ? <span dir="ltr" style={{ color: "#dc2626", fontWeight: 700 }}>{formatCurrency(p.totalCost)}</span> : "—"}
                                        </td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>{p.soldQty || "—"}</td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>
                                          {p.soldAmount > 0 ? <span dir="ltr" style={{ color: "#16a34a", fontWeight: 700 }}>{formatCurrency(p.soldAmount)}</span> : "—"}
                                        </td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>
                                          {p.cogs > 0 ? <span dir="ltr" style={{ color: "#dc2626" }}>{formatCurrency(p.cogs)}</span> : "—"}
                                        </td>
                                        <td style={{ ...tdSt, textAlign: "center", fontWeight: 700 }}>
                                          {(p.totalCost > 0 || p.soldAmount > 0) ? (
                                            <span dir="ltr" style={{ color: p.grossProfit >= 0 ? "#7c3aed" : "#dc2626" }}>{formatCurrency(p.grossProfit)}</span>
                                          ) : "—"}
                                        </td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>{p.remainingQty}</td>
                                        <td style={{ ...tdSt, textAlign: "center" }}>
                                          {p.remainingValue > 0 ? <span dir="ltr" style={{ color: "#0891b2" }}>{formatCurrency(p.remainingValue)}</span> : "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                                      <td style={tdSt}>סה"כ</td>
                                      <td style={{ ...tdSt, textAlign: "center" }}>{s.totalReceived}</td>
                                      <td style={tdSt}></td>
                                      <td style={{ ...tdSt, textAlign: "center" }}><span dir="ltr" style={{ color: "#dc2626" }}>{formatCurrency(s.totalCost)}</span></td>
                                      <td style={{ ...tdSt, textAlign: "center" }}>{s.totalSoldQty}</td>
                                      <td style={{ ...tdSt, textAlign: "center" }}><span dir="ltr" style={{ color: "#16a34a" }}>{formatCurrency(s.totalSoldAmount)}</span></td>
                                      <td style={{ ...tdSt, textAlign: "center" }}><span dir="ltr" style={{ color: "#dc2626" }}>{formatCurrency(s.totalCogs)}</span></td>
                                      <td style={{ ...tdSt, textAlign: "center" }}><span dir="ltr" style={{ color: s.totalGrossProfit >= 0 ? "#7c3aed" : "#dc2626" }}>{formatCurrency(s.totalGrossProfit)}</span></td>
                                      <td style={{ ...tdSt, textAlign: "center" }}>{s.totalRemainingQty}</td>
                                      <td style={{ ...tdSt, textAlign: "center" }}><span dir="ltr" style={{ color: "#0891b2" }}>{formatCurrency(s.totalRemainingValue)}</span></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* ── ITEMS view ── */}
                  {warehouseView === "items" && (() => {
                    const suppliers = [...new Set(summaryRows.map(r => r.supplier).filter(Boolean))];
                    const filteredItems = summaryRows.filter(row => {
                      if (warehouseSearch && !row.name.toLowerCase().includes(warehouseSearch.toLowerCase()) && !row.code.toLowerCase().includes(warehouseSearch.toLowerCase())) return false;
                      if (warehouseSupplierFilter && row.supplier !== warehouseSupplierFilter) return false;
                      if (warehouseStatusFilter && row.status !== warehouseStatusFilter) return false;
                      return true;
                    });
                    return (
                      <>
                        {/* Items toolbar */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0 }}>
                          <input placeholder="חיפוש לפי שם או קוד..." value={warehouseSearch} onChange={e => setWarehouseSearch(e.target.value)}
                            style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", flex: "1 1 160px" }} />
                          {suppliers.length > 0 && (
                            <select value={warehouseSupplierFilter} onChange={e => setWarehouseSupplierFilter(e.target.value)}
                              style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                              <option value="">כל הספקים</option>
                              {suppliers.map(s => <option key={s} value={s!}>{s}</option>)}
                            </select>
                          )}
                          <select value={warehouseStatusFilter} onChange={e => setWarehouseStatusFilter(e.target.value)}
                            style={{ padding: "7px 11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                            <option value="">כל הסטטוסים</option>
                            <option value="תקין">תקין</option>
                            <option value="חסר">חסר</option>
                            <option value="הושלם">הושלם</option>
                            <option value="אין דרישה">אין דרישה</option>
                          </select>
                          <span style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" as const }}>{filteredItems.length} מוצרים</span>
                        </div>
                        {/* Table */}
                        <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th style={{ ...thSt, textAlign: "center" }}>שם מוצר</th>
                                <th style={{ ...thSt, textAlign: "center" }}>ספק</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נכנס למחסן</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נארז</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נותר להקצאה</th>
                                <th style={{ ...thSt, textAlign: "center" }}>קיים כעת</th>
                                <th style={{ ...thSt, textAlign: "center" }}>חסר</th>
                                <th style={{ ...thSt, textAlign: "center" }}>סטטוס</th>
                                <th style={{ ...thSt, textAlign: "center" }}>פירוט</th>
                                <th style={{ ...thSt, textAlign: "center" }}>פעולות</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredItems.map(row => {
                                const statusColors: Record<string, { bg: string; color: string }> = {
                                  "חסר":        { bg: "#fee2e2", color: "#dc2626" },
                                  "הושלם":     { bg: "#dcfce7", color: "#16a34a" },
                                  "תקין":      { bg: "#dbeafe", color: "#2563eb" },
                                  "אין דרישה": { bg: "#f1f5f9", color: "#6b7280" },
                                };
                                const sc = statusColors[row.status] ?? statusColors["תקין"];
                                const rowBg = row.status === "חסר" ? "#fef2f2" : "white";
                                return (
                                  <tr key={row.id} style={{ background: rowBg, cursor: "pointer" }}
                                    onClick={() => setWarehouseDetailCode(row.code)}>
                                    <td style={{ ...tdSt, fontWeight: 600 }}>{row.name}
                                      {row.notes && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{row.notes}</div>}
                                    </td>
                                    <td style={tdSt}>{row.supplier ?? "—"}</td>
                                    <td style={{ ...tdSt, textAlign: "center" }}>{row.baseWarehouseQty}</td>
                                    <td style={{ ...tdSt, textAlign: "center", color: "#2563eb" }}>{row.packedTotal || "—"}</td>
                                    <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: row.remainingToPackQty > 0 ? "#7c3aed" : "#6b7280" }}>
                                      {row.remainingToPackQty > 0 ? row.remainingToPackQty : "—"}
                                    </td>
                                    <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: row.currentQty <= 0 ? "#dc2626" : row.currentQty < row.remainingToPackQty ? "#f59e0b" : "#16a34a" }}>
                                      {row.currentQty}
                                    </td>
                                    <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: row.shortageQty > 0 ? "#dc2626" : "#6b7280" }}>
                                      {row.shortageQty > 0 ? row.shortageQty : "—"}
                                    </td>
                                    <td style={{ ...tdSt, textAlign: "center" }}>
                                      <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, background: sc.bg, color: sc.color }}>
                                        {row.status}
                                      </span>
                                    </td>
                                    <td style={{ ...tdSt, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                                      <button onClick={() => setWarehouseDetailCode(row.code)} className="cc-btn" style={btn("ghost", "sm")}>
                                        פירוט
                                      </button>
                                    </td>
                                    <td style={{ ...tdSt, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                        <button onClick={() => startEditWarehouseItem(row)} className="cc-btn" style={btn("secondary", "sm")}>עריכה</button>
                                        <button onClick={() => deleteWarehouseItemById(row.id)} className="cc-btn" style={btn("danger", "sm")}>מחיקה</button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {filteredItems.length === 0 && (
                                <tr>
                                  <td colSpan={10} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "40px" }}>
                                    {summaryRows.length === 0
                                      ? `לא הוגדרו מוצרי מחסן לשנה ${warehouseYear} — לחץ על "+ הוסף מוצר מחסן"`
                                      : "אין תוצאות לפי הסינון הנוכחי"}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            {filteredItems.length > 0 && (
                              <tfoot style={{ position: "sticky", bottom: 0 }}>
                                <tr style={{ background: "#f8fafc" }}>
                                  <td style={{ ...tdSt, fontWeight: 700 }} colSpan={2}>סה"כ</td>
                                  <td style={{ ...tdSt, textAlign: "center", fontWeight: 700 }}>{filteredItems.reduce((s, r) => s + r.baseWarehouseQty, 0)}</td>
                                  <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{filteredItems.reduce((s, r) => s + r.packedTotal, 0)}</td>
                                  <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{filteredItems.reduce((s, r) => s + r.remainingToPackQty, 0) || "—"}</td>
                                  <td style={{ ...tdSt, textAlign: "center", fontWeight: 700 }}>{filteredItems.reduce((s, r) => s + r.currentQty, 0)}</td>
                                  <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{filteredItems.reduce((s, r) => s + r.shortageQty, 0) || "—"}</td>
                                  <td style={tdSt} colSpan={3}></td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </>
                    );
                  })()}

                </div>{/* /content area */}
              </div>{/* /warehouse panel */}

              {/* Detail modal — 3 sections */}
              {detailItem && (
                <div
                  style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
                  onClick={() => setWarehouseDetailCode(null)}
                >
                  <div
                    style={{ background: "white", borderRadius: "16px", padding: "24px", width: "980px", maxWidth: "96vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Modal header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>{detailItem.name}</h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontFamily: "monospace" }}>{detailItem.code}</p>
                      </div>
                      <button onClick={() => setWarehouseDetailCode(null)} className="cc-btn" style={{ ...iconBtn(), fontSize: "24px" }}>×</button>
                    </div>

                    <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>

                      {/* Section 1 — סיכום כללי */}
                      <div>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151", fontWeight: 700 }}>סיכום כללי</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                          {[
                            { label: "כמות הדרושה", value: detailItem.requiredTotal, color: "#374151" },
                            { label: "כמות לאריזה", value: detailItem.plannedTotal, color: "#374151" },
                            { label: "נארז", value: detailItem.packedTotal, color: "#2563eb" },
                            { label: "עוד לארוז", value: detailItem.remainingToPackQty, color: "#7c3aed" },
                            { label: "חזר למחסן", value: detailItem.returnedTotal, color: "#0891b2" },
                            { label: "קיים כעת", value: detailItem.currentQty, color: detailItem.currentQty <= 0 ? "#dc2626" : "#16a34a" },
                            { label: "חסר", value: detailItem.shortageQty, color: detailItem.shortageQty > 0 ? "#dc2626" : "#16a34a" },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>{label}</div>
                              <div style={{ fontSize: "20px", fontWeight: 700, color }}>{value || "—"}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2 — פירוט לפי מכירות */}
                      <div>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151", fontWeight: 700 }}>פירוט לפי ימי מכירה</h4>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr>
                                <th style={thSt}>יום מכירה</th>
                                <th style={thSt}>שם מוצר ביום</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נדרש</th>
                                <th style={{ ...thSt, textAlign: "center" }}>לאריזה</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נארז</th>
                                <th style={{ ...thSt, textAlign: "center", color: "#2563eb" }}>נמכר</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נשאר</th>
                                <th style={{ ...thSt, textAlign: "center" }}>נספר</th>
                                <th style={{ ...thSt, textAlign: "center", color: "#0891b2" }}>חזר</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailItem.dayDetails.map((d, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                                  <td style={{ ...tdSt, fontWeight: 600 }}>{d.dayName}</td>
                                  <td style={{ ...tdSt, color: "#6b7280" }}>{d.productName}</td>
                                  <td style={{ ...tdSt, textAlign: "center" }}>{d.requiredQty || "—"}</td>
                                  <td style={{ ...tdSt, textAlign: "center" }}>{d.plannedQty || "—"}</td>
                                  <td style={{ ...tdSt, textAlign: "center" }}>{d.actualInQty || "—"}</td>
                                  <td style={{ ...tdSt, textAlign: "center", color: "#2563eb" }}>{d.soldQty || "—"}</td>
                                  <td style={{ ...tdSt, textAlign: "center" }}>{d.remainingQty}</td>
                                  <td style={{ ...tdSt, textAlign: "center" }}>{d.actualEndQty ?? "—"}</td>
                                  <td style={{ ...tdSt, textAlign: "center", color: "#0891b2", fontWeight: d.actualEndQty != null ? 700 : 400 }}>
                                    {d.actualEndQty != null ? d.actualEndQty : "—"}
                                  </td>
                                </tr>
                              ))}
                              {detailItem.dayDetails.length === 0 && (
                                <tr><td colSpan={9} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "24px" }}>
                                  אין ימי מכירה מקושרים לקוד זה בשנה {warehouseYear}
                                </td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Section 3 — נתוני מחסן */}
                      <div>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#374151", fontWeight: 700 }}>נתוני מחסן</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                          {[
                            { label: "יתרת פתיחה", value: detailItem.openingQty },
                            { label: "כניסות", value: detailItem.addedQty },
                            { label: "תיקון", value: detailItem.adjustmentQty, signed: true },
                            { label: "בסיס מחסן (פתיחה + כניסות + תיקון)", value: detailItem.baseWarehouseQty },
                          ].map(({ label, value, signed }) => (
                            <div key={label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>{label}</div>
                              <div style={{ fontSize: "18px", fontWeight: 700, color: signed && (value as number) !== 0 ? "#f59e0b" : "#374151" }}>
                                {signed && (value as number) > 0 ? `+${value}` : value}
                              </div>
                            </div>
                          ))}
                          {detailItem.notes && (
                            <div style={{ background: "#fffbeb", borderRadius: "10px", padding: "12px", gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>הערות</div>
                              <div style={{ fontSize: "13px", color: "#374151" }}>{detailItem.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
      </div>
      {/* מודל טופס הזמנה מראש — גלובלי */}
      {preOrderForm && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10001 }}
          onClick={() => setPreOrderForm(null)}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "560px", maxWidth: "95%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", direction: "rtl" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{preOrderForm.orderId ? "עריכת הזמנה מראש" : "הזמנה מראש חדשה"}</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              <input placeholder="שם לקוח *" value={preOrderForm.customerName} onChange={e => setPreOrderForm(prev => prev ? { ...prev, customerName: e.target.value } : prev)} style={{ ...inputStyle, flex: "1 1 160px" }} />
              <input placeholder="טלפון" value={preOrderForm.customerPhone} onChange={e => setPreOrderForm(prev => prev ? { ...prev, customerPhone: e.target.value } : prev)} style={{ ...inputStyle, flex: "1 1 130px" }} />
              <input placeholder="הערות" value={preOrderForm.notes} onChange={e => setPreOrderForm(prev => prev ? { ...prev, notes: e.target.value } : prev)} style={{ ...inputStyle, flex: "1 1 200px" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
              <select value={poProductId} onChange={e => setPoProductId(Number(e.target.value))} style={{ ...inputStyle, flex: "1 1 160px" }}>
                {(saleDays.find(d => d.id === preOrderForm.saleDayId)?.products ?? activeProducts).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — ₪{p.price}</option>
                ))}
              </select>
              <input type="number" min={1} value={poQty} onChange={e => setPoQty(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, width: "70px" }} />
              <button onClick={addItemToPreOrderForm} className="cc-btn" style={btn("primary")}>+ הוסף</button>
            </div>
            {preOrderForm.items.length === 0 && <div style={{ color: "#94a3b8", marginBottom: "12px" }}>לא נבחרו מוצרים</div>}
            {preOrderForm.items.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#f8fafc", borderRadius: "8px", marginBottom: "6px" }}>
                <div>{item.name} x{item.qty} = ₪{(item.price * item.qty).toFixed(2)}</div>
                <button onClick={() => removeItemFromPreOrderForm(item.id)} className="cc-btn" style={btn("danger", "sm")}>✕</button>
              </div>
            ))}
            {preOrderForm.items.length > 0 && (() => {
              const saleDay = saleDays.find(d => d.id === preOrderForm.saleDayId);
              const dayProducts = saleDay?.products ?? activeProducts;
              const bagProduct = dayProducts.find(p => p.isGiftBag);
              const poRawTotal = preOrderForm.items.reduce((s, i) => s + i.price * i.qty, 0);
              const poFreeQty = preOrderForm.items.filter(i => dayProducts.find(p => p.id === i.id)?.giftTrigger).reduce((s, i) => s + i.qty, 0);
              const poBagInCart = bagProduct ? preOrderForm.items.filter(i => i.id === bagProduct.id).reduce((s, i) => s + i.qty, 0) : 0;
              const poGiftDiscount = bagProduct ? Math.min(poBagInCart, poFreeQty) * bagProduct.price : 0;
              const poTotal = poRawTotal - poGiftDiscount;
              return (
                <div style={{ margin: "8px 0 16px" }}>
                  {poGiftDiscount > 0 && <div style={{ fontSize: "13px", color: "#7c3aed", fontWeight: 700, marginBottom: "2px" }}>🎁 {bagProduct?.name} ×{Math.min(poBagInCart, poFreeQty)} (מתנה) −₪{poGiftDiscount}</div>}
                  <div style={{ fontWeight: "bold" }}>סה"כ: ₪{poTotal.toFixed(2)}</div>
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={savePreOrder} className="cc-btn" style={{ ...btn("primary"), flex: 1 }}>שמור הזמנה</button>
              <button onClick={() => setPreOrderForm(null)} className="cc-btn" style={{ ...btn("secondary"), flex: 1 }}>ביטול</button>
            </div>
          </div>
        </div>
      )}


      {/* מודל סגירת יום מכירה */}
      {showCloseDayModal && activeSaleDay && (() => {
        const inv = getInventoryForDay(activeSaleDay);
        return (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10003 }}
            onClick={() => setShowCloseDayModal(false)}>
            <div style={{ background: "white", borderRadius: "20px", padding: "28px", width: "520px", maxWidth: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 16px 40px rgba(0,0,0,0.3)", direction: "rtl" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setShowCloseDayModal(false)} className="cc-btn" style={{ ...iconBtn(), fontSize: "20px" }}>✕</button>
                <h2 style={{ margin: 0, fontSize: "18px" }}>🔒 סגירת יום — {activeSaleDay.name}</h2>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>הזן את הכמות שנספרה בפועל בסוף היום עבור כל מוצר</p>
              <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {inv.map(item => {
                  const r = computeInventoryRow(item, activeSaleDay.transactions ?? []);
                  return (
                    <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <input
                        type="number" min={0}
                        value={closeDayActuals[item.productId] ?? 0}
                        onChange={e => setCloseDayActuals(prev => ({ ...prev, [item.productId]: Math.max(0, Number(e.target.value)) }))}
                        style={{ width: "70px", padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", textAlign: "center" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>נמכר: {r.soldQty} | צפוי נשאר: {r.remainingQty}</div>
                      </div>
                    </div>
                  );
                })}
                {inv.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>אין מוצרי מלאי ליום זה</div>}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => {
                  Object.entries(closeDayActuals).forEach(([pid, qty]) => {
                    updateInventoryField(activeSaleDay.id, Number(pid), "actualEndQty", qty);
                  });
                  setShowCloseDayModal(false);
                }} className="cc-btn" style={{ ...btn("success", "lg"), flex: 2 }}>✓ שמור ספירת מלאי</button>
                <button onClick={() => setShowCloseDayModal(false)} className="cc-btn" style={{ ...btn("secondary"), flex: 1 }}>ביטול</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* מודל לקוח חדש */}
      {showNewCustomerModalDayId !== null && (
        <div
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
          onClick={() => setShowNewCustomerModalDayId(null)}
        >
          <div
            style={{ background: "white", borderRadius: "16px", padding: "24px", width: "480px", maxWidth: "95%", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", direction: "rtl" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>לקוח חדש</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="שם לקוח *" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} style={inputStyle} />
              <input placeholder="טלפון *" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} style={inputStyle} />
              <input placeholder="תעודת זהות" value={newCustomerIdNumber} onChange={e => setNewCustomerIdNumber(e.target.value)} style={inputStyle} />
              {saleDays.find(d => d.id === showNewCustomerModalDayId)?.type === "walkin" && (
                <select value={newCustomerType} onChange={e => setNewCustomerType(e.target.value as CustomerType)} style={inputStyle}>
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                </select>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { const c = addCustomerForDay(showNewCustomerModalDayId!); if (c && activeSaleDay?.id === showNewCustomerModalDayId) setSelectedCustomer(c); setShowNewCustomerModalDayId(null); }} className="cc-btn" style={{ ...btn("primary"), flex: 1 }}>הוסף לקוח</button>
                <button onClick={() => setShowNewCustomerModalDayId(null)} className="cc-btn" style={{ ...btn("secondary"), flex: 1 }}>ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ מודל תשלום צף ═══ */}
      {showPaymentModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.55)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9000 }}
          onClick={() => { setShowPaymentModal(false); setPaymentModalError(""); }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "28px", width: "460px", maxWidth: "95%", boxShadow: "0 16px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "16px", direction: "rtl" }}
            onClick={e => e.stopPropagation()}>
            {/* כותרת */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>תשלום</h2>
              <button onClick={() => { setShowPaymentModal(false); setPaymentModalError(""); }} className="cc-btn" style={{ ...iconBtn(), fontSize: "22px" }}>✕</button>
            </div>
            {selectedCustomer && <div style={{ fontSize: "15px", color: "#374151", fontWeight: 600 }}>לקוח: {selectedCustomer.name}</div>}
            {paymentModalError && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "10px 14px", color: "#dc2626", fontSize: "14px", fontWeight: 600 }}>
                ⚠️ {paymentModalError}
              </div>
            )}
            {/* סכום */}
            <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
              {giftFreeQty > 0 && <div style={{ fontSize: "13px", color: "#7c3aed", marginBottom: "4px" }}>🎁 {giftBagProduct?.name} ×{giftFreeQty} מתנה</div>}
              {discountAmount > 0 && <div style={{ fontSize: "13px", color: "#16a34a", marginBottom: "4px" }}>הנחה: −₪{discountAmount.toFixed(2)}</div>}
              {paymentMethod === "cash" && roundingDiff !== 0 && <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>עיגול: {roundingDiff > 0 ? "+" : ""}₪{roundingDiff.toFixed(2)}</div>}
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#1e3a8a" }}>₪{effectiveFinalTotal.toFixed(2)}</div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>לתשלום</div>
            </div>
            {/* שיטת תשלום */}
            <div style={{ display: "flex", gap: "8px" }}>
              {(["cash","check","credit"] as const).map(m => (
                <button key={m} onClick={() => { setPaymentMethod(m); setShowCreditModal(false); setPaymentModalError(""); }}
                  className="cc-btn" style={segmentBtn(paymentMethod === m)}>
                  {m === "cash" ? "מזומן" : m === "check" ? "צ'ק" : "אשראי"}
                </button>
              ))}
            </div>
            {/* מזומן */}
            {paymentMethod === "cash" && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input type="number" placeholder="סכום שהתקבל" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", textAlign: "right" }} />
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#16a34a", whiteSpace: "nowrap" }}>
                  עודף: ₪{Math.max(0, Number(cashReceived || 0) - effectiveFinalTotal).toFixed(2)}
                </span>
              </div>
            )}
            {/* צ'ק / אשראי — תשלומים */}
            {(paymentMethod === "check" || paymentMethod === "credit") && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>מספר תשלומים:</span>
                <select value={paymentMethod === "check" ? checkInstallments : creditInstallments}
                  onChange={e => paymentMethod === "check" ? setCheckInstallments(Number(e.target.value)) : setCreditInstallments(Number(e.target.value))}
                  style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                  <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
                </select>
              </div>
            )}
            {/* כפתורי פעולה */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setShowPaymentModal(false); setPaymentModalError(""); }}
                className="cc-btn" style={{ ...btn("secondary"), flex: 1 }}>
                חזרה לקופה
              </button>
              {paymentMethod === "credit" ? (
                <button onClick={() => { setShowPaymentModal(false); setShowCreditModal(true); }}
                  className="cc-btn" style={{ ...btn("success"), flex: 2 }}>
                  שלם באשראי
                </button>
              ) : (
                <button onClick={() => {
                  if (paymentMethod === "cash") {
                    if (!cashReceived || cashReceived.trim() === "") { setPaymentModalError("יש להזין את הסכום שהתקבל"); return; }
                    if (Number(cashReceived) < effectiveFinalTotal) { setPaymentModalError(`הסכום שהתקבל (₪${Number(cashReceived).toFixed(2)}) נמוך מהסכום לתשלום (₪${effectiveFinalTotal.toFixed(2)})`); return; }
                  }
                  setPaymentModalError("");
                  completeSale();
                }}
                  className="cc-btn" style={{ ...btn("primary", "lg"), flex: 2 }}>
                  ✓ אישור וסיום עסקה
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* מודאל החזרת מוצר */}
      {showReturnModal && (() => {
        const q = returnSearch.trim().toLowerCase();
        // build map: txId → { itemId → totalReturnedQty }
        const returnedQtyMap: Record<number, Record<number, number>> = {};
        for (const t of activeTransactions) {
          if (!t.isReturn || !t.returnForId) continue;
          if (!returnedQtyMap[t.returnForId]) returnedQtyMap[t.returnForId] = {};
          for (const item of t.items) {
            returnedQtyMap[t.returnForId][item.id] = (returnedQtyMap[t.returnForId][item.id] ?? 0) + item.qty;
          }
        }
        const filteredTxs = activeTransactions.filter(t => {
          if (t.isReturn) return false;
          const returned = returnedQtyMap[t.id] ?? {};
          if (!t.items.some(item => item.qty - (returned[item.id] ?? 0) > 0)) return false;
          if (!q) return true;
          return t.customerName.toLowerCase().includes(q) || t.customerPhone.includes(q);
        });
        const sourceTx = returnSourceId ? activeTransactions.find(t => t.id === returnSourceId) ?? null : null;
        const disc = sourceTx?.discountPercent ?? 0;
        const grossReturn = sourceTx
          ? sourceTx.items.filter(i => (returnQtys[i.id] ?? 0) > 0).reduce((s, i) => s + i.price * (returnQtys[i.id] ?? 0), 0)
          : 0;
        const returnTotal = grossReturn * (1 - disc / 100);
        return (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10002 }}
            onClick={() => setShowReturnModal(false)}>
            <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "620px", maxWidth: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", direction: "rtl" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>↩ החזרת מוצר</h3>
                <button onClick={() => setShowReturnModal(false)} className="cc-btn" style={btn("secondary", "sm")}>סגור</button>
              </div>

              {!sourceTx ? (
                <>
                  <input
                    placeholder="חיפוש לפי שם לקוח או טלפון..."
                    value={returnSearch}
                    onChange={e => setReturnSearch(e.target.value)}
                    autoFocus
                    style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "14px", marginBottom: "12px", direction: "rtl", textAlign: "right" }}
                  />
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {filteredTxs.length === 0 && <div style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>אין עסקאות</div>}
                    {filteredTxs.map(tx => (
                      <div key={tx.id}
                        onClick={() => { setReturnSourceId(tx.id); setReturnQtys({}); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "6px", cursor: "pointer", background: "#f8fafc" }}>
                        <span style={{ fontWeight: 600 }}>{tx.customerName}</span>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>{tx.date}</span>
                        <span style={{ fontWeight: 700 }}>₪{tx.finalTotal}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: "12px", padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px", fontSize: "14px" }}>
                    <b>{sourceTx.customerName}</b> · {sourceTx.date} · ₪{sourceTx.finalTotal}
                    <button onClick={() => { setReturnSourceId(null); setReturnQtys({}); }} className="cc-btn" style={{ ...iconBtn(), fontSize: "13px", marginRight: "12px" }}>← שנה עסקה</button>
                  </div>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {sourceTx.items.map(item => {
                      const alreadyReturned = returnedQtyMap[sourceTx.id]?.[item.id] ?? 0;
                      const maxReturnable = item.qty - alreadyReturned;
                      if (maxReturnable <= 0) return null;
                      return (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>
                              ₪{item.price} × {item.qty} במקור
                              {alreadyReturned > 0 && <span style={{ color: "#dc2626", marginRight: "6px" }}>(הוחזרו {alreadyReturned})</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "13px" }}>כמות להחזרה:</span>
                            <input
                              type="number" min={0} max={maxReturnable}
                              value={returnQtys[item.id] ?? 0}
                              onChange={e => setReturnQtys(prev => ({ ...prev, [item.id]: Math.min(maxReturnable, Math.max(0, Number(e.target.value))) }))}
                              style={{ width: "60px", padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", textAlign: "center" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {returnTotal > 0 && (
                    <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "12px", marginTop: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "16px", marginBottom: "12px" }}>
                        <span>סה"כ להחזר:</span>
                        <span style={{ color: "#dc2626" }}>₪{returnTotal.toFixed(2)}</span>
                      </div>
                      <button onClick={() => processReturn(sourceTx, returnQtys)}
                        className="cc-btn" style={{ ...btn("danger", "lg"), width: "100%" }}>
                        ✓ בצע החזרה
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}
      {openPriceProduct && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { setOpenPriceProduct(null); setOpenPriceManual(""); }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "28px", minWidth: "320px", maxWidth: "420px", width: "90vw", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", direction: "rtl" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", fontSize: "20px", textAlign: "center" }}>{openPriceProduct.name}</h3>
            <p style={{ margin: "0 0 20px", color: "#6b7280", textAlign: "center", fontSize: "14px" }}>בחר מחיר</p>
            {(openPriceProduct.priceLevels ?? []).length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px", marginBottom: "16px", direction: "rtl" }}>
                {(openPriceProduct.priceLevels ?? []).map(lvl => (
                  <button key={lvl} onClick={() => addToCartWithPrice(openPriceProduct, lvl)}
                    className="cc-btn" style={priceTileBtn()}>
                    ₪{lvl}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                min="0"
                placeholder="מחיר ידני"
                value={openPriceManual}
                onChange={e => setOpenPriceManual(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: "16px", textAlign: "right" }}
                onKeyDown={e => { if (e.key === "Enter" && Number(openPriceManual) > 0) addToCartWithPrice(openPriceProduct, Number(openPriceManual)); }}
                autoFocus
              />
              <button
                onClick={() => addToCartWithPrice(openPriceProduct, Number(openPriceManual))}
                disabled={!(Number(openPriceManual) > 0)}
                className="cc-btn" style={btn("primary")}>
                הוסף
              </button>
            </div>
            <button onClick={() => { setOpenPriceProduct(null); setOpenPriceManual(""); }}
              className="cc-btn" style={{ ...btn("secondary"), marginTop: "14px", width: "100%" }}>
              ביטול
            </button>
          </div>
        </div>
      )}

      {showCreditModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "white", borderRadius: "20px",
            width: "min(620px, 96vw)", height: "min(720px, 92vh)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: "18px" }}>
                תשלום באשראי — ₪{effectiveFinalTotal.toFixed(2)} · {creditInstallments} תשלומים
              </span>
              <button onClick={() => { setShowCreditModal(false); setCreditPaymentError(""); setCreditPaymentProcessing(false); setCreditPaymentSuccess(false); }}
                className="cc-btn" style={{ ...iconBtn(), fontSize: "22px" }}>✕</button>
            </div>
            {creditPaymentSuccess ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "#f0fdf4" }}>
                <div style={{ fontSize: "64px", lineHeight: 1 }}>✅</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#15803d" }}>התשלום בוצע בהצלחה!</div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>חוזר לקופה...</div>
              </div>
            ) : (
              <iframe
                id="NedarimFrame"
                src="https://matara.pro/nedarimplus/iframe?language=he"
                style={{ flex: 1, border: "none", width: "100%" }}
                title="תשלום באשראי"
              />
            )}
            {creditPaymentError && (
              <div style={{ padding: "12px 20px", background: "#fef2f2", color: "#dc2626", fontSize: "14px", fontWeight: 600, textAlign: "center", flexShrink: 0, borderTop: "1px solid #fecaca", direction: "rtl" }}>
                {creditPaymentError}
              </div>
            )}
            {!creditPaymentSuccess && (
              <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", flexShrink: 0 }}>
                <button onClick={() => { setShowCreditModal(false); setCreditPaymentError(""); setCreditPaymentProcessing(false); setCreditPaymentSuccess(false); }}
                  className="cc-btn" style={{ ...btn("secondary", "lg"), flex: 1 }}>
                  ביטול
                </button>
                <button onClick={sendCreditPayment} disabled={creditPaymentProcessing}
                  className={`cc-btn${creditPaymentProcessing ? " loading" : ""}`}
                  style={{ ...btn("success", "lg"), flex: 2 }}>
                  {creditPaymentProcessing ? "⏳ מעבד תשלום..." : "✓ בצע תשלום"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ══ AlertDialog (blocking error/info) ══ */}
      {alertDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: "20px", padding: "28px 32px", maxWidth: "420px", width: "90%", direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", color: "#dc2626" }}>{alertDialog.title}</h3>
            <p style={{ margin: "0 0 24px", color: "#374151", fontSize: "14px", lineHeight: 1.6 }}>{alertDialog.message}</p>
            <button onClick={() => setAlertDialog(null)} className="cc-btn" style={{ ...btn("primary", "md") }}>הבנתי</button>
          </div>
        </div>
      )}

      {/* ══ ConfirmDialog ══ */}
      {confirmDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setConfirmDialog(null)}>
          <div style={{ background: "white", borderRadius: "20px", padding: "28px 32px", maxWidth: "420px", width: "90%", direction: "rtl", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "#111827" }}>{confirmDialog.title}</h3>
            {confirmDialog.itemName && (
              <div style={{ background: "#f1f5f9", borderRadius: "10px", padding: "8px 14px", marginBottom: "12px", fontWeight: 700, color: "#374151", fontSize: "15px" }}>
                {confirmDialog.itemName}
              </div>
            )}
            <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: "14px", whiteSpace: "pre-line" }}>{confirmDialog.message}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-start" }}>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="cc-btn" style={btn(confirmDialog.confirmVariant ?? "danger", "md")}>
                {confirmDialog.confirmLabel ?? "אישור"}
              </button>
              <button onClick={() => setConfirmDialog(null)}
                className="cc-btn" style={btn("secondary", "md")}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Toast Notifications ══ */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 10000, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", pointerEvents: "none" }}>
          {toasts.map(toast => (
            <div key={toast.id} style={{
              padding: "12px 22px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, direction: "rtl",
              maxWidth: "480px", textAlign: "center", pointerEvents: "auto",
              background: toast.type === "success" ? "#166534" : toast.type === "error" ? "#dc2626" : toast.type === "warning" ? "#92400e" : "#1e40af",
              color: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </ErrorBoundary>
  );
}
