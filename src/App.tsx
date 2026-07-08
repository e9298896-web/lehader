import { useEffect, useRef, useState } from "react";
import React from "react";

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
          <h2>אירעה שגיאה בתצוגה</h2>
          
          <div style={{ whiteSpace: "pre-wrap", color: "#b91c1c" }}>
            {String(this.state.error)}
          </div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12 }}>
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

type SaleDayType = "preorder" | "walkin" | "walkin-nodiscount";

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
};

export default function App() {
  const [activeTab, setActiveTab] =
    useState("cashier");

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

  const [activePreOrderRef, setActivePreOrderRef] =
    useState<{ orderId: number; saleDayId: number } | null>(null);


  const [emailAlertMessage, setEmailAlertMessage] =
    useState("");

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
      const saved =
        localStorage.getItem(
          "pendingSales"
        );
      return saved ? JSON.parse(saved) : [];
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
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const [allOrdersSearch, setAllOrdersSearch] = useState("");
  const [allOrdersFilterDayId, setAllOrdersFilterDayId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSearch, setReturnSearch] = useState("");
  const [returnSourceId, setReturnSourceId] = useState<number | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [showDeleteAllOrdersConfirm, setShowDeleteAllOrdersConfirm] = useState(false);
  const [showDeleteAllCustomersConfirm, setShowDeleteAllCustomersConfirm] = useState(false);
  const [customersTabSearch, setCustomersTabSearch] = useState("");
  const [showCustomersModalDayId, setShowCustomersModalDayId] = useState<number | null>(null);
  const [showNewCustomerModalDayId, setShowNewCustomerModalDayId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const [editingProductId, setEditingProductId] =
    useState<number | null>(null);

  const [editingName, setEditingName] =
    useState("");

  const [editingPrice, setEditingPrice] =
    useState("");

  const [editingCategory, setEditingCategory] =
    useState("");

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
  const isNoDiscountMode = activeSaleDay?.type === "preorder" || activeSaleDay?.type === "walkin-nodiscount";

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
    const currentQty = cart.find(i => i.id === product.id)?.qty ?? 0;
    const err = checkCanAddToCart(product.id, currentQty);
    if (err) { setEmailAlertMessage(err); return; }
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { id: product.id, name: product.name, price: getEffectivePrice(product.price), qty: 1 }];
    });
  };

  const increaseQty = (id: number) => {
    const currentQty = cart.find(i => i.id === id)?.qty ?? 0;
    const err = checkCanAddToCart(id, currentQty);
    if (err) { setEmailAlertMessage(err); return; }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item));
  };

  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: item.qty - 1,
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;
  });

  const discountAmount =
    (total * discountPercent) / 100;

  const finalTotal =
    total - discountAmount;

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
      const received = Number(cashReceived || effectiveFinalTotal);
      if (received < effectiveFinalTotal) {
        setEmailAlertMessage(`הסכום שהתקבל (₪${received.toFixed(2)}) נמוך מהסכום לתשלום (₪${effectiveFinalTotal.toFixed(2)})`);
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
      total,
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
    setShowCreditModal(false);
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
    if (!showCreditModal) return;
    const handleNedarimMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;
      const msg = event.data as { Name?: string; Value?: Record<string, string> };
      if (msg.Name !== "TransactionResponse") return;
      setCreditPaymentProcessing(false);
      const v = msg.Value ?? {};
      if (v.StatusCode === "000" || v.Status === "OK") {
        completeSale();
      } else {
        setCreditPaymentError("התשלום נכשל" + (v.Message ? ": " + v.Message : ""));
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
    setCart(sale.items.map((item) => ({ ...item })));
    setCurrentSeller(sale.seller);
    setSelectedCustomer(sale.savedCustomer ?? null);
    setCustomerSearch("");
    setActiveTab("cashier");
    setPendingSales((prev) => prev.filter((s) => s.id !== sale.id));
  };

  const deletePendingSale = (id: number) => {
    setPendingSales((prev) =>
      prev.filter((sale) => sale.id !== id)
    );
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
    if (!window.confirm(`למחוק את יום המכירה "${day?.name ?? id}"? לא ניתן לבטל פעולה זו.`)) return;
    logActivity(`מחיקת יום מכירה — ${day?.name ?? id}`);
    setSaleDays(prev => prev.filter(d => d.id !== id));
  };

  const openPreOrderForm = (saleDayId: number, order?: PreOrder) => {
    setPreOrderForm({
      saleDayId,
      orderId: order?.id,
      customerName: order?.customerName ?? "",
      customerPhone: order?.customerPhone ?? "",
      notes: order?.notes ?? "",
      items: order?.items ? order.items.map(i => ({ ...i })) : [],
    });
    setPoProductId(products[0]?.id ?? 0);
    setPoQty(1);
  };

  const addItemToPreOrderForm = () => {
    if (!preOrderForm) return;
    const product = activeProducts.find(p => p.id === poProductId);
    if (!product) return;
    setPreOrderForm(prev => {
      if (!prev) return prev;
      const existing = prev.items.find(i => i.id === product.id);
      if (existing) {
        return { ...prev, items: prev.items.map(i => i.id === product.id ? { ...i, qty: i.qty + poQty } : i) };
      }
      return { ...prev, items: [...prev.items, { id: product.id, name: product.name, price: product.price, qty: poQty }] };
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
    if (!window.confirm(`למחוק את ההזמנה של "${order?.customerName ?? orderId}"?`)) return;
    logActivity(`מחיקת הזמנה — ${order?.customerName ?? orderId}`);
    setSaleDays(prev => prev.map(day =>
      day.id === saleDayId ? { ...day, preOrders: day.preOrders.filter(o => o.id !== orderId) } : day
    ));
  };

  const buildOrderHtml = (order: PreOrder, dayName: string) => {
    const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const rows = order.items.map(i =>
      `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td>₪${i.price.toFixed(2)}</td><td>₪${(i.price * i.qty).toFixed(2)}</td></tr>`
    ).join("");
    return `
      <div class="order">
        <div class="day-name">${dayName}</div>
        <div class="order-header">
          <strong>${order.customerName}</strong>
          ${order.customerPhone ? ` &nbsp;|&nbsp; ${order.customerPhone}` : ""}
        </div>
        ${order.notes ? `<div class="notes">הערות: ${order.notes}</div>` : ""}
        <table>
          <thead><tr><th>מוצר</th><th>כמות</th><th>מחיר ליחידה</th><th>סה"כ</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">סה"כ לתשלום: ₪${total.toFixed(2)}</div>
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
    setActiveTab("cashier");
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

        const matched = activeProducts.find(
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

        return {
          ...day,
          preOrders: [...day.preOrders, ...importedOrders],
          customers: [...existingCustomers, ...newCustomers],
          products: [...existingProducts, ...newProducts],
        };
      })
    );

    alert(`יובאו ${importedOrders.length} הזמנות בהצלחה`);
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

    if (!newName || !newPrice || !newCategory) {
      return;
    }

    setActiveProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newName,
        price: Number(newPrice),
        category: newCategory,
        stock: 0,
      },
    ]);

    setNewName("");
    setNewPrice("");
    setNewCategory("");
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
      const totalPreordered = preOrders.reduce((sum, o) => {
        const item = o.items.find(i => i.id === inv.productId);
        return sum + (item?.qty ?? 0);
      }, 0);
      const soldViaPreorder = txs.reduce((sum, t) => {
        if (!t.preOrderId) return sum;
        const po = preOrders.find(o => o.id === t.preOrderId);
        const orderedQty = po?.items.find(i => i.id === inv.productId)?.qty ?? 0;
        if (orderedQty === 0) return sum;
        const txQty = Math.min(t.items.find(i => i.id === inv.productId)?.qty ?? 0, orderedQty);
        return t.isReturn ? sum - txQty : sum + txQty;
      }, 0);
      reservedQty = totalPreordered - soldViaPreorder;
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
    const row = computeInventoryRow(inv, txs, activeSaleDay.type === "preorder" ? (activeSaleDay.preOrders ?? []) : undefined);
    return {
      remaining: row.remainingQty,
      reserved: row.reservedQty ?? null,
      available: row.availableQty ?? null,
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
          alert("קובץ לא תקין — ודא שזהו קובץ ייצוא יום מכירה"); return;
        }
        const imported = payload.saleDay;

        // ── ייבוא מוכרים ──
        if (payload.sellers?.length) {
          const importedSellerNames = payload.sellers.map(s => s.name);
          const localNames = new Set(sellers.map(s => s.name));
          const newSellers = payload.sellers.filter(s => !localNames.has(s.name));
          if (newSellers.length > 0) {
            const ok = window.confirm(
              `הקובץ מכיל ${importedSellerNames.length} מוכרים.\n` +
              `${newSellers.length} מוכרים חדשים: ${newSellers.map(s => s.name).join(", ")}\n\nלייבא אותם?`
            );
            if (ok) setSellers(prev => [...prev, ...newSellers]);
          }
        }

        setSaleDays(prev => {
          const existing = prev.find(d => d.id === imported.id);
          if (!existing) {
            const ok = window.confirm(`יום מכירה "${imported.name}" לא נמצא מקומית.\nלהוסיף אותו כיום חדש?`);
            return ok ? [...prev, imported] : prev;
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
            // המחשב הראשי שולט: requiredQty, plannedQty, actualInQty, warehouseCode, productName
            return { ...local, actualEndQty };
          });
          // פריטי מלאי שקיימים בקובץ אך לא מקומית — מתעלמים (המחשב הראשי הוא מקור האמת)

          const summary =
            `סנכרון "${existing.name}" הושלם:\n` +
            `• ${newTxs.length} עסקאות חדשות נוספו\n` +
            `• ${newCustomers.length} לקוחות חדשים נוספו\n` +
            `• ${ordersUpdated} הזמנות עודכנו ל-שולם\n` +
            `• ${endQtyUpdated} ערכי "נספר בפועל" עודכנו` +
            (conflicts.length ? `\n\n⚠️ ${conflicts.length} התנגשויות ב"נספר בפועל" (לא עודכנו):\n${conflicts.join("\n")}` : "");
          alert(summary);

          const merged: SaleDay = {
            ...existing,
            transactions: [...(existing.transactions ?? []), ...newTxs],
            customers: [...(existing.customers ?? []), ...newCustomers],
            preOrders: mergedOrders,
            inventory: mergedInv,
          };
          return prev.map(d => d.id === existing.id ? merged : d);
        });
      } catch {
        alert("שגיאה בקריאת הקובץ — ודא שזהו קובץ ייצוא תקין");
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

  if (!window.confirm("שחזור גיבוי ידרוס את כל הנתונים הקיימים. להמשיך?")) {
    e.target.value = "";
    return;
  }

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (backup.products)
      setProducts(backup.products);

    if (backup.customers)
      setCustomers(backup.customers);

    if (backup.transactions)
      setTransactions(
        backup.transactions
      );

    if (backup.sellers) {
      const s = backup.sellers;
      if (s.length > 0 && typeof s[0] === "string") {
        setSellers((s as string[]).map(name => ({ name, isAdmin: false })));
      } else {
        setSellers(s);
      }
    }

    if (backup.saleDays)
      setSaleDays(backup.saleDays);

    logActivity(`שחזור גיבוי — ${file.name}`);
    if (backup.warehouseItems) setWarehouseItems(backup.warehouseItems);
    alert("הגיבוי שוחזר בהצלחה");
  } catch {
    alert("קובץ גיבוי לא תקין");
  }
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

  const clearWarehouseForm = () => {
    setWhCode(""); setWhName(""); setWhOpeningQty(""); setWhAddedQty(""); setWhAdjQty(""); setWhNotes("");
    setWarehouseEditId(null); setWarehouseFormVisible(false);
  };

  const saveWarehouseItem = () => {
    if (!whCode.trim() || !whName.trim()) return;
    const code = whCode.trim().toUpperCase();
    const dup = warehouseItems.find(w => w.year === warehouseYear && w.code === code && w.id !== (warehouseEditId ?? -1));
    if (dup) { alert(`קוד "${code}" כבר קיים בשנה זו`); return; }
    const item: WarehouseItem = {
      id: warehouseEditId ?? Date.now(),
      year: warehouseYear,
      code,
      name: whName.trim(),
      openingQty: Number(whOpeningQty) || 0,
      addedQty: Number(whAddedQty) || 0,
      adjustmentQty: Number(whAdjQty) || 0,
      notes: whNotes.trim() || undefined,
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
    setWarehouseEditId(item.id); setWarehouseFormVisible(true);
  };

  const deleteWarehouseItemById = (id: number) => {
    if (!window.confirm("למחוק מוצר מחסן זה?")) return;
    setWarehouseItems(prev => prev.filter(w => w.id !== id));
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
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditingName("");
    setEditingPrice("");
    setEditingCategory("");
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

    setActiveProducts((prev) =>
      prev.map((product) =>
        product.id === editingProductId
          ? {
              ...product,
              name: editingName,
              price: Number(editingPrice),
              category: editingCategory,
              stock: product.stock,
            }
          : product
      )
    );

    cancelEditProduct();
  };

  const startEditCustomer = (
    customer: Customer
  ) => {
    setEditingCustomerId(customer.id);
    setEditingCustomerName(customer.name);
    setEditingCustomerPhone(customer.phone);
    setEditingCustomerIdNumber(customer.idNumber);
    setEditingCustomerType(customer.customerType);
  };

  const cancelEditCustomer = () => {
    setEditingCustomerId(null);
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
    setSaleDays(prev => prev.map(d => d.id === dayId ? { ...d, customers: (d.customers ?? []).filter(c => c.id !== customerId) } : d));
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
        transaction.items.forEach((item) => {
          const product = activeProducts.find(
            (p) => p.id === item.id
          );
          const category =
            product?.category || "לא ידוע";
          acc[category] =
            (acc[category] || 0) +
            item.price * item.qty;
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

 const renderBarChart = (
    data: Record<string, number>
  ) => {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return <div>אין נתונים להצגה</div>;
    }
    const maxValue = Math.max(
      ...entries.map(([, value]) => value)
    );
    return entries.map(([key, value]) => (
      <div
        key={key}
        style={{
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            marginBottom: "4px",
          }}
         >
          {key}: ₪{value.toFixed(2)}
        </div>
        <div
          style={{
            height: "18px",
            background: "#e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${
                maxValue > 0
                  ? (value / maxValue) * 100
                  : 0
              }%`,
              height: "100%",
              background: "#2563eb",
            }}
          />
        </div>
      </div>
    ));
  };

  const blueButton = {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  const redButton = {
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
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
        {/* 1. כפתור מסך מלא צף חדש בפינה השמאלית העליונה */}
        <button
          onClick={toggleFullscreen}
          style={{
            position: "fixed",
            top: "15px",
            left: "15px",
            zIndex: 10000, // מוודא שהוא תמיד יהיה מעל הכל
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: "50%",
            width: "45px",
            height: "45px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "20px",
            transition: "transform 0.2s ease",
          }}
          title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isFullscreen ? (
  /* חיצים אלכסוניים פנימה - יציאה ממסך מלא */
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="10" y1="14" x2="3" y2="21" />
  </svg>
) : (
  /* חיצים אלכסוניים החוצה - כניסה למסך מלא */
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)}
        </button>

        {/* 2. שורת הלשוניות תוצג רק אם אנחנו *לא* במסך מלא */}
        {!isFullscreen && (
          <div
            style={{
              background: "#083f1e",
              display: "flex",
              alignItems: "stretch",
              position: "sticky",
              top: 0,
              zIndex: 1000,
              borderBottom: "3px solid #248f4b",
              paddingRight: "16px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {[
              ["cashier", "קופה"],
              ["products", "מוצרים"],
              ["transactions", "עסקאות"],
              ["sellers", "מוכרים"],
              ["saledays", "מכירות"],
              ["inventory", "מלאי"],
              ["warehouse", "מחסן"],
              ["reports", "דוחות"],
            ]
              .filter(
                ([key]) =>
                  !((key === "reports" || key === "saledays" || key === "inventory" || key === "warehouse") && currentRole !== "admin")
              )
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    background: activeTab === key ? "rgba(255,255,255,0.12)" : "transparent",
                    color: activeTab === key ? "#ffffff" : "rgba(255,255,255,0.6)",
                    border: "none",
                    borderBottom: activeTab === key ? "3px solid #e2e8f0" : "3px solid transparent",
                    padding: "12px 18px",
                    fontSize: "14px",
                    fontWeight: activeTab === key ? "700" : "400",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    marginBottom: "-3px",
                  }}
                >
                  {label}
                </button>
              ))}
          </div>
        )}

        {emailAlertMessage && (
          <div
            style={{
              background: "#fee2e2",
              border: "2px solid #dc2626",
              borderRadius: "8px",
              padding: "16px",
              margin: "12px 20px",
              color: "#991b1b",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div>{emailAlertMessage}</div>
            <button
              onClick={() => setEmailAlertMessage("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#dc2626",
                fontSize: "20px",
                cursor: "pointer",
                padding: "0",
                minWidth: "30px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ padding: "20px" }}>
          {activeTab === "cashier" && (
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px", alignItems: "start" }}>

            {/* ── פאנל שמאל: מוצרים ולקוח ── */}
            <div style={{ background: "white", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "0", height: isFullscreen ? "calc(100vh - 60px)" : "calc(100vh - 90px)", overflow: "hidden", position: "sticky", top: isFullscreen ? "20px" : "55px" }}>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", paddingBottom: "10px" }}>

              {/* כותרת + מוכר + תפקיד */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, flex: 1, fontSize: "22px", textAlign: "right" }}>{activeSaleDay ? activeSaleDay.name : "מערכת להדר"}</h2>
                <label style={{ fontSize: "13px", color: "#6b7280" }}>
                  מוכר:&nbsp;
                  <select value={currentSeller} onChange={e => setCurrentSeller(e.target.value)} style={{ ...inputStyle, padding: "4px 8px", fontSize: "13px", width: "auto" }}>
                    {sellers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </label>
                {activeSaleDay && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: "10px", padding: "4px 10px", fontSize: "13px", fontWeight: "bold" }}>
                    ⚡
                    {activeSaleDay.type === "walkin" && <span style={{ color: "#d97706" }}>לקוחות עם הנחה</span>}
                    {activeSaleDay.type === "walkin-nodiscount" && <span style={{ color: "#d97706" }}>לקוחות ללא הנחה</span>}
                    {activeSaleDay.type === "preorder" && <span style={{ color: "#d97706" }}>ממתינות: {activeSaleDay.preOrders.filter(o => o.status === "pending").length}</span>}
                  </div>
                )}
              </div>

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
                  style={{ ...blueButton, whiteSpace: "nowrap", padding: "8px 14px", fontSize: "13px" }}
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
                    style={{ background: selectedCategory === cat ? "#2563eb" : "#f1f5f9", color: selectedCategory === cat ? "white" : "#374151", border: "none", borderRadius: "12px", padding: "11px 22px", fontSize: "17px", fontWeight: 600, cursor: "pointer" }}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* גריד מוצרים */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                {filteredProducts.map(product => (
                  <button key={product.id} onClick={() => addToCart(product)}
                    style={{ background: "#eff6ff", border: "2px solid transparent", borderRadius: "14px", padding: "16px 10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#2563eb")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                  >
                    <span style={{ fontSize: "15px" }}>{product.name}</span>
                    <span style={{ color: "#2563eb", fontSize: "16px" }}>₪{getEffectivePrice(product.price)}</span>
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

              {/* תשלום */}
              <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "12px", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
                  {(["cash","check","credit"] as const).map(m => (
                    <button key={m} onClick={() => { setPaymentMethod(m); setShowCreditModal(false); }}
                      style={{ padding: "10px 14px", fontSize: "15px", fontWeight: 700, border: "2px solid", borderColor: paymentMethod === m ? "#2563eb" : "#e2e8f0", borderRadius: "12px", background: paymentMethod === m ? "#eff6ff" : "#f8fafc", color: paymentMethod === m ? "#2563eb" : "#6b7280", cursor: "pointer", whiteSpace: "nowrap" }}>
                      {m === "cash" ? "מזומן" : m === "check" ? "צ'ק" : "אשראי"}
                    </button>
                  ))}
                  {paymentMethod === "cash" && <>
                    <input type="number" placeholder="סכום שהתקבל" value={cashReceived} onChange={e => setCashReceived(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "120px" }} />
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#16a34a", whiteSpace: "nowrap" }}>
                      עודף: ₪{Math.max(0, Number(cashReceived || 0) - effectiveFinalTotal).toFixed(2)}
                    </span>
                  </>}
                  {(paymentMethod === "check" || paymentMethod === "credit") && <>
                    <span style={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>תשלומים:</span>
                    <select value={paymentMethod === "check" ? checkInstallments : creditInstallments}
                      onChange={e => paymentMethod === "check" ? setCheckInstallments(Number(e.target.value)) : setCreditInstallments(Number(e.target.value))}
                      style={{ ...inputStyle, width: "80px" }}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setShowReturnModal(true); setReturnSearch(""); setReturnSourceId(null); setReturnQtys({}); }}
                    style={{ flex: 1, padding: "12px", background: "#7c3aed", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    ↩ החזרה
                  </button>
                  <button onClick={savePendingSale}
                    style={{ flex: 1, padding: "12px", background: "#f59e0b", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    ⏸ שמירה
                  </button>
                  {paymentMethod === "credit" ? (
                    <button onClick={() => setShowCreditModal(true)}
                      style={{ flex: 2, padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                      מעבר לתשלום באשראי
                    </button>
                  ) : (
                    <button onClick={completeSale}
                      style={{ flex: 2, padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                      ✓ סיום עסקה
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── פאנל ימין: סל ── */}
            <div style={{ background: "white", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", gap: "0", height: isFullscreen ? "calc(100vh - 60px)" : "calc(100vh - 90px)", overflow: "hidden", position: "sticky", top: isFullscreen ? "20px" : "55px" }}>

              {/* כותרת סל */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  סל קניות
                </h2>
                {cart.length > 0 && <span style={{ background: "#2563eb", color: "white", borderRadius: "20px", padding: "2px 10px", fontSize: "13px", fontWeight: 700 }}>{cart.length}</span>}
                <button onClick={clearCart} style={{ marginRight: "auto", padding: "4px 12px", background: "white", color: "#dc2626", border: "2px solid #dc2626", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  נקה סל
                </button>
              </div>

              {/* פריטים בסל */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {cart.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", paddingTop: "40px" }}>הסל ריק</div>}
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: "14px" }}>{item.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button onClick={() => decreaseQty(item.id)} style={{ ...redButton, padding: "2px 10px", fontSize: "16px" }}>−</button>
                      <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => increaseQty(item.id)} style={{ ...blueButton, padding: "2px 10px", fontSize: "16px" }}>+</button>
                    </div>
                    <span style={{ minWidth: "60px", textAlign: "left", color: "#2563eb", fontWeight: 700, fontSize: "14px" }}>₪{(item.price * item.qty).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* סיכום */}
              <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "10px", marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6b7280", marginBottom: "3px" }}>
                  <span>סכום</span><span>₪{total}</span>
                </div>
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

              {/* עסקאות בהמתנה */}
              {pendingSales.length > 0 && (
                <div style={{ borderTop: "2px solid #f1f5f9", marginTop: "10px", paddingTop: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400e", marginBottom: "6px" }}>⏸ בהמתנה ({pendingSales.length})</div>
                  <div style={{ maxHeight: "140px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {pendingSales.map((sale) => (
                      <div key={sale.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef3c7", borderRadius: "8px", padding: "6px 10px", fontSize: "13px" }}>
                        <span style={{ fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sale.customerName || "ללא שם"}</span>
                        <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>₪{sale.finalTotal}</span>
                        <button onClick={() => resumePendingSale(sale)} style={{ ...blueButton, padding: "4px 10px", fontSize: "12px", whiteSpace: "nowrap" }}>חזור</button>
                        <button onClick={() => deletePendingSale(sale.id)} style={{ ...redButton, padding: "4px 10px", fontSize: "12px" }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}


    {activeTab === "products" && (
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 70px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
              <h2 style={{ margin: 0 }}>ניהול מוצרים</h2>
              {activeSaleDay && <span style={{ fontSize: "16px", color: "#6b7280", fontWeight: 500 }}>— {activeSaleDay.name}</span>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowNewProductForm(v => !v)}
                  style={{ ...blueButton, background: "#10b981", padding: "10px 20px", fontSize: "15px" }}
                  disabled={currentRole !== "admin"}
                >
                  {showNewProductForm ? "✕ סגור" : "+ הוספת מוצר חדש"}
                </button>
              </div>
              {showNewProductForm && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px", background: "#f8fafc", borderRadius: "16px", padding: "16px" }}>
                  <input
                    placeholder="שם מוצר"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={inputStyle}
                    disabled={currentRole !== "admin"}
                  />
                  <input
                    type="number"
                    placeholder="מחיר"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    style={inputStyle}
                    disabled={currentRole !== "admin"}
                  />
                  <input
                    placeholder="קטגוריה"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={inputStyle}
                    disabled={currentRole !== "admin"}
                  />
                  <button
                    onClick={() => { addProduct(); setShowNewProductForm(false); }}
                    style={blueButton}
                    disabled={currentRole !== "admin"}
                  >
                    הוסף מוצר
                  </button>
                </div>
              )}
            </div>

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            {activeProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  padding: "12px",
                  background: "#f8fafc",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  flexWrap: "wrap",
                }}
              >
                {editingProductId === product.id ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flex: 1,
                        minWidth: "300px",
                      }}
                    >
                      <input
                        placeholder="שם"
                        value={editingName}
                        onChange={(e) =>
                          setEditingName(
                            e.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          flex: 1,
                          padding: "8px",
                          fontSize: "14px",
                        }}
                      />
                      <input
                        placeholder="קטגוריה"
                        value={editingCategory}
                        onChange={(e) =>
                          setEditingCategory(
                            e.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          flex: 1,
                          padding: "8px",
                          fontSize: "14px",
                        }}
                      />
                      <input
                        type="number"
                        placeholder="מחיר"
                        value={editingPrice}
                        onChange={(e) =>
                          setEditingPrice(
                            e.target.value
                          )
                        }
                        style={{
                          ...inputStyle,
                          flex: 0.7,
                          padding: "8px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <button
                        onClick={saveEditedProduct}
                        style={{
                          ...blueButton,
                          padding: "6px 12px",
                          fontSize: "14px",
                        }}
                      >
                        שמור
                      </button>
                      <button
                        onClick={cancelEditProduct}
                        style={{
                          ...redButton,
                          padding: "6px 12px",
                          fontSize: "14px",
                        }}
                      >
                        ביטול
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        flex: 1,
                        minWidth: "300px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", minWidth: "100px" }}>
                        {product.name}
                      </div>
                      <div style={{ minWidth: "80px", fontSize: "14px" }}>
                        {product.category}
                      </div>
                      <div style={{ minWidth: "60px", fontSize: "14px" }}>
                        ₪{product.price}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button
                          onClick={() => moveProduct(product.id, "up")}
                          style={{ padding: "2px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "white", cursor: "pointer", lineHeight: 1 }}
                        >▲</button>
                        <button
                          onClick={() => moveProduct(product.id, "down")}
                          style={{ padding: "2px 8px", fontSize: "12px", border: "1px solid #cbd5e1", borderRadius: "4px", background: "white", cursor: "pointer", lineHeight: 1 }}
                        >▼</button>
                      </div>
                      <button
                        onClick={() =>
                          startEditProduct(product)
                        }
                        style={{
                          ...blueButton,
                          padding: "6px 12px",
                          fontSize: "14px",
                        }}
                      >
                        ערוך
                      </button>
                      <button
                        onClick={() =>
                          setActiveProducts((prev) =>
                            prev.filter(
                              (p) => p.id !== product.id
                            )
                          )
                        }
                        style={{
                          ...redButton,
                          padding: "6px 12px",
                          fontSize: "14px",
                        }}
                      >
                        מחק
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 70px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <h2 style={{ margin: 0 }}>עסקאות</h2>
                {activeSaleDay && <span style={{ fontSize: "16px", color: "#6b7280", fontWeight: 500 }}>— {activeSaleDay.name}</span>}
              </div>
              {currentRole === "admin" && (
                <button
                  onClick={() => {
                    const dayName = activeSaleDay ? activeSaleDay.name : "כל העסקאות";
                    if (window.confirm(`למחוק את כל העסקאות של "${dayName}"? פעולה זו אינה הפיכה.`)) {
                      setActiveTransactions([]);
                    }
                  }}
                  style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "10px", padding: "8px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  איפוס עסקאות
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            {activeTransactions.map((transaction) => {
              const isExpanded = expandedTransactionId === transaction.id;
              return (
                <div key={transaction.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <div
                    onClick={() => setExpandedTransactionId(isExpanded ? null : transaction.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                      padding: "10px 12px",
                      fontSize: "14px",
                      flexWrap: "wrap",
                      cursor: "pointer",
                      background: isExpanded ? "#f0f9ff" : "transparent",
                    }}
                  >
                    <div style={{ fontWeight: "bold", flex: 1, minWidth: "120px" }}>
                      {transaction.customerName}
                    </div>
                    <div style={{ minWidth: "100px", fontSize: "13px", color: "#6b7280" }}>{transaction.customerPhone}</div>
                    <div style={{ minWidth: "80px" }}>{transaction.seller}</div>
                    {!isNoDiscountMode && <div style={{ minWidth: "60px" }}>{transaction.discountPercent}%</div>}
                    <div style={{ minWidth: "70px", color: transaction.isReturn ? "#dc2626" : undefined, fontWeight: transaction.isReturn ? 700 : 400 }}>₪{transaction.finalTotal}</div>
                    <div style={{ minWidth: "70px", fontSize: "13px", color: transaction.isReturn ? "#dc2626" : "#0891b2", fontWeight: transaction.isReturn ? 700 : 400 }}>
                      {transaction.isReturn ? "↩ החזרה" : ({ cash: "מזומן", check: "המחאה", credit: "אשראי" }[transaction.paymentMethod ?? ""] ?? transaction.paymentMethod ?? "")}
                    </div>
                    <div style={{ minWidth: "140px", fontSize: "12px" }}>{transaction.date}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{isExpanded ? "▲" : "▼"}</div>
                  </div>
                  {isExpanded && (
                    <div style={{ background: "#f8fafc", padding: "10px 24px 14px", fontSize: "13px" }}>
                      {transaction.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #e2e8f0" }}>
                          <span>{item.name} × {item.qty}</span>
                          <span style={{ color: "#374151" }}>₪{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontWeight: "bold" }}>
                        <span>סה"כ</span>
                        <span>₪{transaction.finalTotal}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}

        {activeTab === "saledays" && (
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 70px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h2 style={{ margin: 0 }}>מכירות</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => saleDayImportRef.current?.click()}
                  style={{ ...blueButton, background: "#7c3aed", padding: "8px 14px", fontSize: "13px" }}
                >
                  ↑ ייבא יום מכירה
                </button>
                <input ref={saleDayImportRef} type="file" accept=".json" style={{ display: "none" }} onChange={importSaleDayData} />
              </div>
            </div>

            {/* טופס יצירת יום מכירה חדש */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowNewSaleDayForm(v => !v)}
                  style={{ ...blueButton, background: "#10b981", padding: "10px 20px", fontSize: "15px" }}
                >
                  {showNewSaleDayForm ? "✕ סגור" : "+ יצירת מכירה חדשה"}
                </button>
              </div>
              {showNewSaleDayForm && (
                <div style={{ background: "#f8fafc", borderRadius: "16px", padding: "16px" }}>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      placeholder="שם מכירה"
                      value={newSaleDayName}
                      onChange={e => setNewSaleDayName(e.target.value)}
                      style={{ ...inputStyle, flex: "1 1 160px" }}
                    />
                    <input
                      type="date"
                      value={newSaleDayDate}
                      onChange={e => setNewSaleDayDate(e.target.value)}
                      style={{ ...inputStyle, flex: "0 0 160px" }}
                    />
                    <select
                      value={newSaleDayType}
                      onChange={e => setNewSaleDayType(e.target.value as SaleDayType)}
                      style={{ ...inputStyle, flex: "0 0 200px" }}
                    >
                      <option value="walkin">לקוחות עם הנחה</option>
                      <option value="walkin-nodiscount">לקוחות ללא הנחה</option>
                      <option value="preorder">הזמנות</option>
                    </select>
                    <button
                      onClick={() => { addSaleDay(); setShowNewSaleDayForm(false); }}
                      style={blueButton}
                    >
                      צור יום מכירה
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* רשימת ימי מכירה */}
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            {saleDays.length === 0 && <div style={{ color: "#94a3b8" }}>לא קיימים ימי מכירה</div>}
            {saleDays.map(day => (
              <div
                key={day.id}
                style={{
                  border: `2px solid ${day.isActive ? "#2563eb" : "#e2e8f0"}`,
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "16px",
                  background: day.isActive ? "#eff6ff" : "white",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "18px", textAlign: "right" }}>
                      {day.name}
                      {day.isActive && <span style={{ color: "#2563eb", fontSize: "14px", marginRight: "10px" }}> פעיל</span>}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                      {day.date && <span>{day.date} | </span>}
                      {day.type === "walkin"
                        ? `לקוחות עם הנחה`
                        : day.type === "walkin-nodiscount"
                        ? `לקוחות ללא הנחה`
                        : `הזמנות: ${day.preOrders.length} (${day.preOrders.filter(o => o.status === "pending").length} ממתינות)`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggleSaleDay(day.id)}
                      style={{ ...blueButton, background: day.isActive ? "#dc2626" : "#2563eb", padding: "8px 14px", fontSize: "14px" }}
                    >
                      {day.isActive ? "כבה" : "הפעל"}
                    </button>
                    {day.type === "preorder" && (
                      <button
                        onClick={() => { setAllOrdersFilterDayId(day.id); setAllOrdersSearch(""); setShowAllOrdersModal(true); }}
                        style={{ ...blueButton, background: "#0891b2", padding: "8px 14px", fontSize: "14px" }}
                      >
                        הזמנות
                      </button>
                    )}
                    {(day.type === "walkin" || day.type === "walkin-nodiscount") && (
                      <button
                        onClick={() => { setShowCustomersModalDayId(day.id); setCustomersTabSearch(""); setEditingCustomerId(null); setHistoryCustomerId(null); }}
                        style={{ ...blueButton, background: "#0891b2", padding: "8px 14px", fontSize: "14px" }}
                      >
                        לקוחות
                      </button>
                    )}
                    <button
                      onClick={() => exportSaleDayData(day.id)}
                      style={{ ...blueButton, background: "#7c3aed", padding: "8px 14px", fontSize: "14px" }}
                    >
                      ↓ ייצא
                    </button>
                    <button
                      onClick={() => deleteSaleDay(day.id)}
                      style={{ ...redButton, padding: "8px 14px", fontSize: "14px" }}
                    >
                      מחק
                    </button>
                  </div>
                </div>

              </div>
            ))}
            </div>

            {/* מודל טופס הזמנה מראש */}
            {preOrderForm && (
              <div
                style={{
                  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                  background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
                  alignItems: "center", zIndex: 10001,
                }}
                onClick={() => setPreOrderForm(null)}
              >
                <div
                  style={{
                    background: "white", borderRadius: "16px", padding: "24px",
                    width: "560px", maxWidth: "95%", maxHeight: "85vh", overflowY: "auto",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <h3 style={{ marginTop: 0 }}>
                    {preOrderForm.orderId ? "עריכת הזמנה מראש" : "הזמנה מראש חדשה"}
                  </h3>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                    <input
                      placeholder="שם לקוח *"
                      value={preOrderForm.customerName}
                      onChange={e => setPreOrderForm(prev => prev ? { ...prev, customerName: e.target.value } : prev)}
                      style={{ ...inputStyle, flex: "1 1 160px" }}
                    />
                    <input
                      placeholder="טלפון"
                      value={preOrderForm.customerPhone}
                      onChange={e => setPreOrderForm(prev => prev ? { ...prev, customerPhone: e.target.value } : prev)}
                      style={{ ...inputStyle, flex: "1 1 130px" }}
                    />
                    <input
                      placeholder="הערות"
                      value={preOrderForm.notes}
                      onChange={e => setPreOrderForm(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                      style={{ ...inputStyle, flex: "1 1 200px" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                    <select
                      value={poProductId}
                      onChange={e => setPoProductId(Number(e.target.value))}
                      style={{ ...inputStyle, flex: "1 1 160px" }}
                    >
                      {activeProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — ₪{p.price}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={poQty}
                      onChange={e => setPoQty(Math.max(1, Number(e.target.value)))}
                      style={{ ...inputStyle, width: "70px" }}
                    />
                    <button onClick={addItemToPreOrderForm} style={{ ...blueButton, padding: "10px 14px" }}>
                      + הוסף
                    </button>
                  </div>

                  {preOrderForm.items.length === 0 && (
                    <div style={{ color: "#94a3b8", marginBottom: "12px" }}>לא נבחרו מוצרים</div>
                  )}
                  {preOrderForm.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "6px 10px", background: "#f8fafc", borderRadius: "8px", marginBottom: "6px",
                      }}
                    >
                      <div>{item.name} x{item.qty} = ₪{(item.price * item.qty).toFixed(2)}</div>
                      <button
                        onClick={() => removeItemFromPreOrderForm(item.id)}
                        style={{ ...redButton, padding: "4px 8px", fontSize: "12px" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {preOrderForm.items.length > 0 && (
                    <div style={{ fontWeight: "bold", margin: "8px 0 16px" }}>
                      סה"כ: ₪{preOrderForm.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={savePreOrder} style={{ ...blueButton, flex: 1 }}>שמור הזמנה</button>
                    <button onClick={() => setPreOrderForm(null)} style={{ ...redButton, flex: 1 }}>ביטול</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sellers" && (
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 70px)",
            }}
          >
            <h2>מוכרים</h2>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom:
                  "20px",
              }}
            >
              <input
                placeholder="שם מוכר"
                value={newSeller}
                onChange={(e) =>
                  setNewSeller(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

              <button
                onClick={addSeller}
                style={blueButton}
              >
                הוסף
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            {sellers.map((seller) => (
              <div
                key={seller.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontWeight: "500" }}>{seller.name}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#6b7280", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={seller.isAdmin}
                      onChange={e => setSellers(prev => prev.map(s => s.name === seller.name ? { ...s, isAdmin: e.target.checked } : s))}
                    />
                    מנהל
                  </label>
                </div>
                <button
                  onClick={() => setSellers(prev => prev.filter(s => s.name !== seller.name))}
                  style={redButton}
                >
                  מחק
                </button>
              </div>
            ))}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "24px",
            }}
          >
            <h2>דוחות</h2>

            <div
              style={{
                fontSize: "22px",
                marginBottom:
                  "15px",
              }}
            >
              מספר עסקאות:
              {
                activeTransactions.length
              }
            </div>

            <div
              style={{
                fontSize: "22px",
                marginBottom:
                  "20px",
              }}
            >
              סך מכירות:
              ₪
              {activeTransactions.reduce(
                (sum, t) =>
                  sum +
                  t.finalTotal,
                0
              )}
            </div>

            <div
              style={{
                marginBottom: "24px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() =>
                  setSelectedReportType("daily")
                }
                style={{
                  ...blueButton,
                  background:
                    selectedReportType === "daily"
                      ? "#2563eb"
                      : "#94a3b8",
                }}
              >
                יומי
              </button>
              <button
                onClick={() =>
                  setSelectedReportType("monthly")
                }
                style={{
                  ...blueButton,
                  background:
                    selectedReportType === "monthly"
                      ? "#2563eb"
                      : "#94a3b8",
                }}
              >
                חודשי
              </button>
              <button
                onClick={() =>
                  setSelectedReportType("category")
                }
                style={{
                  ...blueButton,
                  background:
                    selectedReportType === "category"
                      ? "#2563eb"
                      : "#94a3b8",
                }}
              >
                לפי קטגוריה
              </button>
              <button
                onClick={() =>
                  setSelectedReportType("customer")
                }
                style={{
                  ...blueButton,
                  background:
                    selectedReportType === "customer"
                      ? "#2563eb"
                      : "#94a3b8",
                }}
              >
                לפי לקוח
              </button>
              <button
                onClick={() =>
                  setSelectedReportType("seller")
                }
                style={{
                  ...blueButton,
                  background:
                    selectedReportType === "seller"
                      ? "#2563eb"
                      : "#94a3b8",
                }}
              >
                לפי מוכר
              </button>
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              {selectedReportType === "daily" &&
                renderBarChart(getDailySalesReport())}
              {selectedReportType === "monthly" &&
                renderBarChart(getMonthlySalesReport())}
              {selectedReportType === "category" &&
                renderBarChart(getCategorySalesReport())}
              {selectedReportType === "customer" &&
                renderBarChart(getCustomerSalesReport())}
              {selectedReportType === "seller" &&
                renderBarChart(getSellerSalesReport())}
            </div>

            <div
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <button
    onClick={exportData}
    style={blueButton}
  >
    ייצוא לאקסל
  </button>

  <button
    onClick={exportBackup}
    style={blueButton}
  >
    גיבוי מלא
  </button>

  <input
    type="file"
    accept=".json"
    onChange={importBackup}
    style={{
      padding: "10px",
      background: "white",
      borderRadius: "12px",
      border: "1px solid #cbd5e1",
    }}
  />
</div>

            {activityLog.length > 0 && (
              <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#374151" }}>יומן פעילות</h3>
                  <button onClick={() => { if (window.confirm("למחוק את יומן הפעילות?")) setActivityLog([]); }}
                    style={{ padding: "4px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>
                    נקה יומן
                  </button>
                </div>
                <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 }}>תאריך</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 }}>מוכר</th>
                        <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 }}>פעולה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLog.slice(0, 100).map(entry => (
                        <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "7px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{entry.date}</td>
                          <td style={{ padding: "7px 12px", color: "#374151" }}>{entry.seller}</td>
                          <td style={{ padding: "7px 12px", color: "#374151" }}>{entry.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "inventory" && (() => {
          const selectedDay = inventorySelectedDayId ? saleDays.find(d => d.id === inventorySelectedDayId) : null;
          const years = [...new Set(saleDays.map(d => getSaleDayYear(d)))].sort((a, b) => b - a);
          const daysInYear = saleDays.filter(d => getSaleDayYear(d) === inventorySelectedYear);

          const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "right", fontWeight: 700, fontSize: "13px", color: "#374151", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 2 };
          const tdStyle: React.CSSProperties = { padding: "8px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" };
          const inputNum = (val: number, onChange: (v: number) => void): React.ReactNode =>
            <input type="number" min={0} value={val || ""} onChange={e => onChange(Number(e.target.value) || 0)}
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
            <div style={{ background: "white", borderRadius: "24px", padding: "24px" }}>
              <h2 style={{ margin: "0 0 20px 0", fontSize: "22px" }}>
                ניהול מלאי{selectedDay ? <span style={{ fontWeight: 400, color: "#6b7280", fontSize: "18px" }}> — {selectedDay.name}</span> : null}
              </h2>

              {/* ── פס שלבים ── */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "#f1f5f9", borderRadius: "12px", padding: "4px" }}>
                {stepDefs.map((s, i) => (
                  <button key={s.key}
                    onClick={() => { if (s.key !== "select" && !selectedDay) return; setInventoryStep(s.key); }}
                    style={{
                      flex: 1, padding: "10px 8px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      background: inventoryStep === s.key ? "white" : "transparent",
                      color: inventoryStep === s.key ? "#1e40af" : "#64748b",
                      boxShadow: inventoryStep === s.key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                      opacity: s.key !== "select" && !selectedDay ? 0.45 : 1,
                    }}>
                    <span style={{ color: "#94a3b8", marginLeft: "4px", fontWeight: 400, fontSize: "11px" }}>{i + 1}.</span>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* ════ שלב 1: בחירת יום ════ */}
              {inventoryStep === "select" && (
                <div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                    <select value={inventorySelectedDayId ?? ""} onChange={e => setInventorySelectedDayId(Number(e.target.value) || null)}
                      style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", minWidth: "220px" }}>
                      <option value="">— בחר יום מכירה —</option>
                      {[...saleDays].reverse().map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({getSaleDayYear(d)})</option>
                      ))}
                    </select>
                    {selectedDay && (
                      <button onClick={() => setInventoryStep("planning")}
                        style={{ padding: "10px 18px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
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
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                        {([
                          { label: "מוצרים", value: dayRows.length, color: "#374151" },
                          { label: "כמות דרושה", value: totalRequired, color: "#374151" },
                          { label: "כמות שנארזה", value: totalPacked, color: totalPacked >= totalRequired ? "#16a34a" : "#f59e0b" },
                          { label: "חסר", value: totalShortage, color: totalShortage > 0 ? "#dc2626" : "#16a34a" },
                          ...(isPreorderDay ? [
                            { label: "שמור להזמנות", value: totalReserved!, color: "#7c3aed" },
                            { label: "פנוי למכירה", value: totalAvailable!, color: (totalAvailable ?? 0) > 0 ? "#0891b2" : "#dc2626" },
                          ] : []),
                        ] as { label: string; value: number; color: string }[]).map(card => (
                          <div key={card.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "4px" }}>{card.label}</div>
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
                <div>
                  {!selectedDay ? noDay : (
                    <>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                        {selectedDay.type === "preorder" && (
                          <button onClick={() => syncPreorderRequiredQty(selectedDay)}
                            style={{ padding: "8px 14px", background: "#0891b2", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                            ↻ סנכרן כמות דרושה מהזמנות
                          </button>
                        )}
                        {selectedDay.type !== "preorder" && (() => {
                          const lastYear = getLastYearDay(selectedDay);
                          return (
                            <>
                              <button onClick={() => fillRequiredFromLastYear(selectedDay)}
                                style={{ padding: "8px 14px", background: "#7c3aed", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                                {lastYear ? `↻ מלא דרוש משנה ${new Date(lastYear.id).getFullYear()}` : "↻ ייבא מאקסל שנה שעברה"}
                              </button>
                              <input ref={lastYearFileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) importLastYearFromXlsx(selectedDay, f); e.target.value = ""; }} />
                            </>
                          );
                        })()}
                        <button onClick={() => setInventoryStep("packing")}
                          style={{ padding: "8px 14px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                          עבור לעדכון אריזה ←
                        </button>
                      </div>
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>מוצר</th>
                              <th style={{ ...thStyle, textAlign: "center" }}>קוד מחסן</th>
                              <th style={{ ...thStyle, textAlign: "center" }}>כמות הדרושה</th>
                              <th style={{ ...thStyle, textAlign: "center" }}>כמות לאריזה</th>
                              <th style={{ ...thStyle, textAlign: "center" }}>פער</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const dayYear = new Date(selectedDay.id).getFullYear();
                              const whOptions = warehouseItems.filter(w => w.year === dayYear);
                              return dayRows.map(row => {
                              const planned = row.plannedQty ?? 0;
                              const diff = planned - row.requiredQty;
                              return (
                                <tr key={row.productId}>
                                  <td style={tdStyle}>{row.productName}</td>
                                  <td style={{ ...tdStyle, textAlign: "center" }}>
                                    <select
                                      value={row.warehouseCode ?? ""}
                                      onChange={e => updateInventoryWarehouseCode(selectedDay.id, row.productId, e.target.value)}
                                      style={{ padding: "4px 6px", borderRadius: "6px", border: row.warehouseCode ? "1px solid #0891b2" : "1px solid #e2e8f0", fontSize: "12px", background: row.warehouseCode ? "#f0f9ff" : "#fafafa", minWidth: "120px" }}>
                                      <option value="">— ללא קישור —</option>
                                      {whOptions.map(w => <option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}
                                    </select>
                                    {!row.warehouseCode && whOptions.length > 0 && (
                                      <div style={{ fontSize: "10px", color: "#f59e0b", marginTop: "2px" }}>לא מקושר למחסן</div>
                                    )}
                                  </td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600 }}>{row.requiredQty}</td>
                                  <td style={{ ...tdStyle, textAlign: "center" }}>
                                    {inputNum(planned, v => updateInventoryField(selectedDay.id, row.productId, "plannedQty", v))}
                                  </td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700,
                                    color: row.plannedQty == null ? "#9ca3af" : diff === 0 ? "#6b7280" : diff > 0 ? "#0891b2" : "#dc2626" }}>
                                    {row.plannedQty == null ? "—" : diff === 0 ? "—" : diff > 0 ? `+${diff}` : diff}
                                  </td>
                                </tr>
                              );
                            }); })()}
                            {dayRows.length === 0 && (
                              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#9ca3af", padding: "24px" }}>אין מוצרים ביום זה</td></tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: "#f8fafc" }}>
                              <td style={{ ...tdStyle, fontWeight: 700 }}>סה"כ</td>
                              <td style={tdStyle}></td>
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.requiredQty, 0)}</td>
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + (r.plannedQty ?? 0), 0)}</td>
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                                {(() => { const t = dayRows.filter(r => r.plannedQty != null).reduce((s, r) => s + (r.plannedQty ?? 0) - r.requiredQty, 0); return t === 0 ? "—" : t > 0 ? `+${t}` : t; })()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ════ שלב 3: עדכון אריזה ════ */}
              {inventoryStep === "packing" && (
                <div>
                  {!selectedDay ? noDay : (() => {
                    const inv = getInventoryForDay(selectedDay);
                    return (
                      <>
                        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                          <button onClick={() => setInventoryStep("live")}
                            style={{ padding: "8px 14px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                            עבור למצב מכירה ←
                          </button>
                        </div>
                        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th style={thStyle}>מוצר</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>כמות לאריזה</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>כמות שנארזה</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>פער</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סטטוס</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayRows.map(row => {
                                const planned = row.plannedQty ?? 0;
                                const diff = row.actualInQty - planned;
                                const hasData = planned > 0 || row.actualInQty > 0;
                                const status = !hasData ? null
                                  : diff < 0 ? { label: "חסר", color: "#dc2626", bg: "#fef2f2" }
                                  : diff === 0 ? { label: "תקין", color: "#16a34a", bg: "#f0fdf4" }
                                  : { label: "עודף", color: "#0891b2", bg: "#f0f9ff" };
                                return (
                                  <tr key={row.productId}>
                                    <td style={tdStyle}>{row.productName}</td>
                                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600, color: planned === 0 ? "#9ca3af" : "#374151" }}>
                                      {planned === 0 ? "—" : planned}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>
                                      {inputNum(row.actualInQty, v => updateInventoryField(selectedDay.id, row.productId, "actualInQty", v))}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700,
                                      color: !hasData ? "#9ca3af" : diff === 0 ? "#6b7280" : diff > 0 ? "#0891b2" : "#dc2626" }}>
                                      {!hasData ? "—" : diff === 0 ? "—" : diff > 0 ? `+${diff}` : diff}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>
                                      {status && (
                                        <span style={{ background: status.bg, color: status.color, padding: "3px 10px", borderRadius: "20px", fontWeight: 700, fontSize: "12px" }}>
                                          {status.label}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {inv.length === 0 && (
                                <tr><td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#9ca3af", padding: "24px" }}>אין מוצרים ביום זה</td></tr>
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
                <div>
                  {!selectedDay ? noDay : (
                    <>
                      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                        <button onClick={() => setInventoryStep("closing")}
                          style={{ padding: "8px 14px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                          עבור לסגירת מלאי ←
                        </button>
                      </div>
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>מוצר</th>
                              <th style={{ ...thStyle, textAlign: "center" }}>נארז</th>
                              <th style={{ ...thStyle, textAlign: "center", color: "#2563eb" }}>נמכר</th>
                              {isPreorderDay && <th style={{ ...thStyle, textAlign: "center", color: "#7c3aed" }}>שמור</th>}
                              {isPreorderDay && <th style={{ ...thStyle, textAlign: "center", color: "#0891b2" }}>פנוי</th>}
                              <th style={{ ...thStyle, textAlign: "center" }}>נשאר</th>
                              <th style={{ ...thStyle, textAlign: "center", color: "#0891b2" }}>סכום נמכר</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayRows.map(row => (
                              <tr key={row.productId}>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>{row.productName}</td>
                                <td style={{ ...tdStyle, textAlign: "center" }}>{row.actualInQty}</td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 600, color: "#2563eb" }}>{row.soldQty}</td>
                                {isPreorderDay && <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: (row.reservedQty ?? 0) > 0 ? "#7c3aed" : "#6b7280" }}>{row.reservedQty ?? 0}</td>}
                                {isPreorderDay && <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: (row.availableQty ?? 0) > 0 ? "#0891b2" : "#dc2626" }}>{row.availableQty ?? 0}</td>}
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: row.remainingQty < 0 ? "#dc2626" : row.remainingQty === 0 ? "#6b7280" : "#16a34a" }}>
                                  {row.remainingQty}
                                </td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>₪{row.soldAmount.toFixed(2)}</td>
                              </tr>
                            ))}
                            {dayRows.length === 0 && (
                              <tr><td colSpan={isPreorderDay ? 7 : 5} style={{ ...tdStyle, textAlign: "center", color: "#9ca3af", padding: "24px" }}>אין מוצרים ביום זה</td></tr>
                            )}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: "#f8fafc" }}>
                              <td style={{ ...tdStyle, fontWeight: 700 }}>סה"כ</td>
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.actualInQty, 0)}</td>
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{dayRows.reduce((s, r) => s + r.soldQty, 0)}</td>
                              {isPreorderDay && <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{dayRows.reduce((s, r) => s + (r.reservedQty ?? 0), 0)}</td>}
                              {isPreorderDay && <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>{dayRows.reduce((s, r) => s + (r.availableQty ?? 0), 0)}</td>}
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.remainingQty, 0)}</td>
                              <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>₪{dayRows.reduce((s, r) => s + r.soldAmount, 0).toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ════ שלב 5: סגירת מלאי ════ */}
              {inventoryStep === "closing" && (
                <div>
                  {!selectedDay ? noDay : (() => {
                    const hasEndQty = dayRows.some(r => r.actualEndQty != null);
                    return (
                      <>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>הזן את הכמות שנספרה בפועל לבדיקת סטייה</p>
                          <button onClick={() => exportInventoryToXlsx(selectedDay)}
                            style={{ padding: "8px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                            ↓ ייצא לאקסל
                          </button>
                        </div>
                        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th style={thStyle}>מוצר</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>אמור להישאר</th>
                                <th style={{ ...thStyle, textAlign: "center", color: "#0f766e" }}>נספר בפועל</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סטייה</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dayRows.map(row => {
                                const variance = row.varianceQty;
                                return (
                                  <tr key={row.productId}>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{row.productName}</td>
                                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: row.remainingQty < 0 ? "#dc2626" : "#16a34a" }}>
                                      {row.remainingQty}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>
                                      <input type="number" min={0}
                                        value={row.actualEndQty ?? ""}
                                        onChange={e => updateInventoryField(selectedDay.id, row.productId, "actualEndQty", Number(e.target.value) || 0)}
                                        placeholder="—"
                                        style={{ width: "70px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #0d9488", fontSize: "13px", textAlign: "center" }} />
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700,
                                      color: variance == null ? "#9ca3af" : variance > 0 ? "#16a34a" : variance < 0 ? "#dc2626" : "#6b7280" }}>
                                      {variance == null ? "—" : variance > 0 ? `+${variance}` : variance}
                                    </td>
                                  </tr>
                                );
                              })}
                              {dayRows.length === 0 && (
                                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#9ca3af", padding: "24px" }}>אין מוצרים ביום זה</td></tr>
                              )}
                            </tbody>
                            {hasEndQty && (
                              <tfoot>
                                <tr style={{ background: "#f0fdfa" }}>
                                  <td style={{ ...tdStyle, fontWeight: 700 }}>סה"כ</td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + r.remainingQty, 0)}</td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{dayRows.reduce((s, r) => s + (r.actualEndQty ?? 0), 0)}</td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700,
                                    color: (() => { const t = dayRows.filter(r => r.varianceQty != null).reduce((s, r) => s + (r.varianceQty ?? 0), 0); return t > 0 ? "#16a34a" : t < 0 ? "#dc2626" : "#6b7280"; })() }}>
                                    {(() => { const t = dayRows.filter(r => r.varianceQty != null).reduce((s, r) => s + (r.varianceQty ?? 0), 0); return t > 0 ? `+${t}` : t === 0 && dayRows.some(r => r.varianceQty != null) ? "0" : "—"; })()}
                                  </td>
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

              {/* ── סיכום שנתי (קביל) ── */}
              <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "20px", marginTop: "32px" }}>
                <button onClick={() => setAnnualOpen(o => !o)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "0 0 12px 0", fontSize: "15px", fontWeight: 700, color: "#374151" }}>
                  <span style={{ fontSize: "13px", color: "#9ca3af", transform: annualOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s" }}>▶</span>
                  סיכום שנתי
                </button>
                {annualOpen && (
                  <div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                      <select value={inventorySelectedYear} onChange={e => setInventorySelectedYear(Number(e.target.value))}
                        style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <button onClick={() => exportAnnualInventoryToXlsx(inventorySelectedYear)}
                        style={{ padding: "8px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                        ↓ ייצא לאקסל
                      </button>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>{daysInYear.length} ימי מכירה בשנה זו</span>
                    </div>
                    {(() => {
                      type AnnualRow = {
                        key: string; label: string; isLinked: boolean;
                        warehouseCode?: string; warehouseName?: string;
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
                                isLinked: true, warehouseCode: item.warehouseCode, warehouseName: whItem?.name,
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
                                key: `pid:${item.productId}`, label: item.productName,
                                isLinked: false,
                                required: r.requiredQty, actualIn: r.actualInQty, sold: r.soldQty, amount: r.soldAmount, remaining: r.remainingQty,
                                byDay: [entry],
                              });
                            }
                          }
                        });
                      });
                      const allRows = [...linkedMap.values(), ...unlinkedMap.values()];
                      return (
                        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                              <tr>
                                <th style={thStyle}>מוצר / קוד מחסן</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סה"כ דרוש</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סה"כ נכנס</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סה"כ נמכר</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סכום נמכר</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>סה"כ נשאר</th>
                                <th style={{ ...thStyle, textAlign: "center" }}>פירוט לפי מכירה</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allRows.map(row => (
                                <tr key={row.key} style={{ background: row.isLinked ? "white" : "#fffbeb" }}>
                                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                                    {row.label}
                                    {row.isLinked && row.warehouseCode && (
                                      <span style={{ marginRight: "6px", fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>({row.warehouseCode})</span>
                                    )}
                                    {!row.isLinked && (
                                      <span style={{ marginRight: "8px", fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "8px", fontWeight: 400 }}>לא מקושר למחסן</span>
                                    )}
                                  </td>
                                  <td style={{ ...tdStyle, textAlign: "center" }}>{row.required}</td>
                                  <td style={{ ...tdStyle, textAlign: "center" }}>{row.actualIn}</td>
                                  <td style={{ ...tdStyle, textAlign: "center", color: "#2563eb", fontWeight: 600 }}>{row.sold}</td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>₪{row.amount.toFixed(2)}</td>
                                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: row.remaining < 0 ? "#dc2626" : row.remaining === 0 ? "#6b7280" : "#16a34a" }}>{row.remaining}</td>
                                  <td style={{ ...tdStyle, fontSize: "11px", color: "#6b7280" }}>
                                    {row.byDay.map(d => `${d.dayName}: נכנס ${d.actualIn} נמכר ${d.sold} ₪${d.amount.toFixed(0)}`).join(" | ")}
                                  </td>
                                </tr>
                              ))}
                              {allRows.length === 0 && (
                                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#9ca3af", padding: "24px" }}>אין נתוני מלאי לשנה זו</td></tr>
                              )}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: "#f8fafc" }}>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>סה"כ</td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{allRows.reduce((s, r) => s + r.required, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{allRows.reduce((s, r) => s + r.actualIn, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{allRows.reduce((s, r) => s + r.sold, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700, color: "#0891b2" }}>₪{allRows.reduce((s, r) => s + r.amount, 0).toFixed(2)}</td>
                                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{allRows.reduce((s, r) => s + r.remaining, 0)}</td>
                                <td style={tdStyle}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === "warehouse" && (() => {
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
            <div style={{ background: "white", borderRadius: "24px", padding: "24px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ margin: 0, fontSize: "22px" }}>ניהול מחסן</h2>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <select value={warehouseYear} onChange={e => setWarehouseYear(Number(e.target.value))}
                    style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={() => exportWarehouseToXlsx(warehouseYear)}
                    style={{ padding: "8px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    ↓ ייצא לאקסל
                  </button>
                  {!warehouseFormVisible && (
                    <button onClick={() => setWarehouseFormVisible(true)}
                      style={{ padding: "8px 14px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      + הוסף מוצר מחסן
                    </button>
                  )}
                </div>
              </div>

              {/* Add/Edit form */}
              {warehouseFormVisible && (
                <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "20px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px" }}>{warehouseEditId != null ? "עריכת מוצר מחסן" : "הוספת מוצר מחסן"}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>קוד מוצר *</label>
                      <input value={whCode} onChange={e => setWhCode(e.target.value.toUpperCase())} placeholder="לדוגמה: CHOCO-500" style={inpSt} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>שם מוצר *</label>
                      <input value={whName} onChange={e => setWhName(e.target.value)} placeholder="שם המוצר במחסן" style={inpSt} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>יתרת פתיחה</label>
                      <input type="number" min={0} value={whOpeningQty} onChange={e => setWhOpeningQty(e.target.value)} style={inpSt} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>כניסות למחסן</label>
                      <input type="number" min={0} value={whAddedQty} onChange={e => setWhAddedQty(e.target.value)} style={inpSt} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>תיקון מלאי</label>
                      <input type="number" value={whAdjQty} onChange={e => setWhAdjQty(e.target.value)} style={inpSt} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "4px" }}>הערות</label>
                      <input value={whNotes} onChange={e => setWhNotes(e.target.value)} style={inpSt} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button onClick={saveWarehouseItem}
                      style={{ padding: "8px 20px", background: "#1e40af", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      {warehouseEditId != null ? "שמור שינויים" : "הוסף"}
                    </button>
                    <button onClick={clearWarehouseForm}
                      style={{ padding: "8px 16px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: "10px", fontSize: "13px", cursor: "pointer" }}>
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {/* Summary table */}
              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "65vh" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={thSt}>שם מוצר</th>
                      <th style={{ ...thSt, textAlign: "center" }}>נכנס למחסן</th>
                      <th style={{ ...thSt, textAlign: "center", color: "#2563eb" }}>נארז</th>
                      <th style={{ ...thSt, textAlign: "center", color: "#7c3aed" }}>עוד לארוז</th>
                      <th style={{ ...thSt, textAlign: "center" }}>קיים כעת</th>
                      <th style={{ ...thSt, textAlign: "center", color: "#dc2626" }}>חסר</th>
                      <th style={{ ...thSt, textAlign: "center" }}>סטטוס</th>
                      <th style={{ ...thSt, textAlign: "center" }}>פירוט</th>
                      <th style={{ ...thSt, textAlign: "center" }}>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map(row => {
                      const statusColors: Record<string, { bg: string; color: string }> = {
                        "חסר":       { bg: "#fee2e2", color: "#dc2626" },
                        "הושלם":    { bg: "#dcfce7", color: "#16a34a" },
                        "תקין":     { bg: "#dbeafe", color: "#2563eb" },
                        "אין דרישה": { bg: "#f1f5f9", color: "#6b7280" },
                      };
                      const sc = statusColors[row.status] ?? statusColors["תקין"];
                      const rowBg = row.status === "חסר" ? "#fef2f2" : "white";
                      return (
                        <tr key={row.id} style={{ background: rowBg }}>
                          <td style={tdSt}>
                            <div style={{ fontWeight: 600 }}>{row.name}</div>
                            {row.notes && <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{row.notes}</div>}
                          </td>
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
                          <td style={{ ...tdSt, textAlign: "center" }}>
                            <button onClick={() => setWarehouseDetailCode(row.code)}
                              style={{ padding: "4px 10px", background: "#f1f5f9", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>
                              פירוט
                            </button>
                          </td>
                          <td style={{ ...tdSt, textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button onClick={() => startEditWarehouseItem(row)}
                                style={{ padding: "4px 8px", background: "#e0f2fe", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer" }}>
                                עריכה
                              </button>
                              <button onClick={() => deleteWarehouseItemById(row.id)}
                                style={{ padding: "4px 8px", background: "#fee2e2", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", color: "#dc2626" }}>
                                מחיקה
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {summaryRows.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "40px" }}>
                          לא הוגדרו מוצרי מחסן לשנה {warehouseYear} — לחץ על &quot;+ הוסף מוצר מחסן&quot;
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {summaryRows.length > 0 && (
                    <tfoot>
                      <tr style={{ background: "#f8fafc" }}>
                        <td style={{ ...tdSt, fontWeight: 700 }}>סה"כ</td>
                        <td style={{ ...tdSt, textAlign: "center", fontWeight: 700 }}>{summaryRows.reduce((s, r) => s + r.baseWarehouseQty, 0)}</td>
                        <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{summaryRows.reduce((s, r) => s + r.packedTotal, 0)}</td>
                        <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{summaryRows.reduce((s, r) => s + r.remainingToPackQty, 0) || "—"}</td>
                        <td style={{ ...tdSt, textAlign: "center", fontWeight: 700 }}>{summaryRows.reduce((s, r) => s + r.currentQty, 0)}</td>
                        <td style={{ ...tdSt, textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{summaryRows.reduce((s, r) => s + r.shortageQty, 0) || "—"}</td>
                        <td style={tdSt} colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

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
                      <button onClick={() => setWarehouseDetailCode(null)}
                        style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280", lineHeight: 1, padding: 0 }}>×</button>
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
      {/* מודל הצג לקוחות */}
      {showCustomersModalDayId !== null && (() => {
        const modalDay = saleDays.find(d => d.id === showCustomersModalDayId);
        if (!modalDay) return null;
        const modalCustomers = modalDay.customers ?? [];
        const filtered = modalCustomers.filter(c => {
          const q = customersTabSearch.trim();
          if (!q || q.length < 2) return true;
          if (/^[0-9]+$/.test(q)) {
            return phoneMatch(c.phone, q);
          }
          const qLow = q.toLowerCase(); const nameLow = String(c.name || "").toLowerCase();
          return nameLow.split(" ").some(w => w.startsWith(qLow));
        });
        return (
          <div
            style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
            onClick={() => { setShowCustomersModalDayId(null); setEditingCustomerId(null); setHistoryCustomerId(null); }}
          >
            <div
              style={{ background: "white", borderRadius: "16px", padding: "24px", width: "700px", maxWidth: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => { setShowNewCustomerModalDayId(showCustomersModalDayId!); setNewCustomerName(""); setNewCustomerPhone(""); setNewCustomerIdNumber(""); setNewCustomerType("3"); }} style={{ ...blueButton, background: "#10b981", padding: "8px 14px", fontSize: "14px" }}>+ לקוח חדש</button>
                  <label style={{ ...blueButton, background: "#7c3aed", padding: "8px 14px", fontSize: "14px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                    ייבוא מאקסל
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => importCustomersForDay(e, showCustomersModalDayId!)} />
                  </label>
                  <button onClick={() => setShowDeleteAllCustomersConfirm(true)} style={{ ...redButton, padding: "8px 14px", fontSize: "14px" }}>מחק הכל</button>
                  <button onClick={() => { setShowCustomersModalDayId(null); setEditingCustomerId(null); setHistoryCustomerId(null); }} style={{ padding: "8px 14px", fontSize: "14px", background: "#6b7280", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>סגור</button>
                </div>
                <h3 style={{ margin: 0 }}>לקוחות: {modalDay.name}</h3>
              </div>

              {showDeleteAllCustomersConfirm && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
                  <div style={{ background: "white", borderRadius: "16px", padding: "32px 28px", width: "360px", maxWidth: "90%", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                    <p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>מחיקת כל הלקוחות</p>
                    <p style={{ color: "#6b7280", marginBottom: "24px" }}>האם אתה בטוח שברצונך למחוק את כל הלקוחות?</p>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <button onClick={() => { deleteAllCustomersForDay(showCustomersModalDayId!); setShowDeleteAllCustomersConfirm(false); }} style={{ ...redButton, padding: "10px 24px" }}>כן, מחק הכל</button>
                      <button onClick={() => setShowDeleteAllCustomersConfirm(false)} style={{ ...blueButton, padding: "10px 24px" }}>ביטול</button>
                    </div>
                  </div>
                </div>
              )}

              <input
                placeholder="חיפוש לקוח לפי שם או טלפון..."
                value={customersTabSearch}
                onChange={e => setCustomersTabSearch(e.target.value)}
                autoFocus
                style={{ ...inputStyle, marginBottom: "12px", direction: "rtl", textAlign: "right" }}
              />

              {customersTabSearch.trim().length >= 2 && (
                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                  {filtered.length} / {modalCustomers.length} לקוחות
                </div>
              )}
              <div style={{ overflowY: "auto", flex: 1 }}>
                {filtered.length === 0 && <div style={{ color: "#94a3b8" }}>אין לקוחות</div>}
                {filtered.map((customer, _fi) => (
                  <div key={`${customer.id}-${_fi}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 12px", borderBottom: "1px solid #ddd", fontSize: "14px", flexWrap: "wrap" }}>
                    {editingCustomerId === customer.id ? (
                      <>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => saveEditedCustomerForDay(showCustomersModalDayId!)} style={{ ...blueButton, padding: "6px 12px", fontSize: "14px" }}>שמור</button>
                          <button onClick={cancelEditCustomer} style={{ ...redButton, padding: "6px 12px", fontSize: "14px" }}>ביטול</button>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flex: "1 1 300px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <input placeholder="שם" value={editingCustomerName} onChange={e => setEditingCustomerName(e.target.value)} style={{ ...inputStyle, flex: "1 1 140px", fontSize: "14px" }} />
                          <input placeholder="טלפון" value={editingCustomerPhone} onChange={e => setEditingCustomerPhone(e.target.value)} style={{ ...inputStyle, flex: "1 1 120px", fontSize: "14px" }} />
                          <input placeholder="ת.ז." value={editingCustomerIdNumber} onChange={e => setEditingCustomerIdNumber(e.target.value)} style={{ ...inputStyle, flex: "1 1 120px", fontSize: "14px" }} />
                          {modalDay.type === "walkin" && (
                            <select value={editingCustomerType} onChange={e => setEditingCustomerType(e.target.value as CustomerType)} style={{ ...inputStyle, flex: "0 0 80px", fontSize: "14px" }}>
                              <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                            </select>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => startEditCustomer(customer)} style={{ ...blueButton, padding: "6px 12px", fontSize: "14px" }}>ערוך</button>
                          <button onClick={() => deleteCustomerForDay(customer.id, showCustomersModalDayId!)} style={{ ...redButton, padding: "6px 12px", fontSize: "14px" }}>מחק</button>
                          <button onClick={() => setHistoryCustomerId(customer.id)} style={{ ...blueButton, padding: "6px 12px", fontSize: "14px", background: "#10b981" }}>היסטוריה</button>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: "220px", justifyContent: "flex-end" }}>
                          <div style={{ minWidth: "100px", textAlign: "right" }}>{customer.phone}</div>
                          <div style={{ fontWeight: "bold", minWidth: "120px", textAlign: "right" }}>{customer.name}</div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {historyCustomerId !== null && (
              <div
                style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}
                onClick={() => setHistoryCustomerId(null)}
              >
                <div
                  style={{ padding: "24px", background: "#f0fdf4", borderRadius: "12px", width: "550px", maxWidth: "92%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}
                  onClick={e => e.stopPropagation()}
                >
                  <h3>היסטוריית רכישות עבור {modalDay.customers?.find(c => c.id === historyCustomerId)?.name}</h3>
                  <button onClick={() => setHistoryCustomerId(null)} style={{ ...redButton, padding: "6px 12px", fontSize: "14px", marginBottom: "10px" }}>סגור</button>
                  {(() => {
                    const history = getCustomerHistoryForDay(historyCustomerId, showCustomersModalDayId!);
                    if (history.length === 0) return <div>אין עסקאות להצגה</div>;
                    return history.map(t => (
                      <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "8px 12px", borderBottom: "1px solid #ddd", fontSize: "12px", flexWrap: "wrap" }}>
                        <div>{t.date}</div>
                        <div>{t.seller}</div>
                        <div style={{ minWidth: "100px", fontWeight: "bold" }}>�{t.finalTotal}</div>
                        <div style={{ fontSize: "11px", color: "#666" }}>{t.items.map(i => `${i.name} (${i.qty})`).join(", ")}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
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
                <button onClick={() => { const c = addCustomerForDay(showNewCustomerModalDayId!); if (c && activeSaleDay?.id === showNewCustomerModalDayId) setSelectedCustomer(c); setShowNewCustomerModalDayId(null); }} style={{ ...blueButton, flex: 1 }}>הוסף לקוח</button>
                <button onClick={() => setShowNewCustomerModalDayId(null)} style={{ ...redButton, flex: 1 }}>ביטול</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllOrdersModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 9999,
          }}
          onClick={() => setShowAllOrdersModal(false)}
        >
          <div
            style={{
              background: "white", borderRadius: "16px", padding: "24px",
              width: "700px", maxWidth: "95%", maxHeight: "85vh",
              display: "flex", flexDirection: "column",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {allOrdersFilterDayId && (
                  <>
                    <button onClick={() => openPreOrderForm(allOrdersFilterDayId)} style={{ ...blueButton, background: "#10b981", padding: "6px 12px", fontSize: "14px" }}>+ הזמנה חדשה</button>
                    <label style={{ ...blueButton, background: "#7c3aed", padding: "6px 12px", fontSize: "14px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                      ייבוא מאקסל
                      <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={e => importPreOrdersFromExcel(e, allOrdersFilterDayId)} />
                    </label>
                  </>
                )}
                <button
                  onClick={() => {
                    const daysToShow = allOrdersFilterDayId
                      ? saleDays.filter(d => d.id === allOrdersFilterDayId)
                      : saleDays.filter(d => d.type === "preorder");
                    const orders = daysToShow.flatMap(d =>
                      d.preOrders.map(order => ({ order, dayName: d.name }))
                    );
                    printAllOrdersList(orders);
                  }}
                  style={{ padding: "6px 12px", fontSize: "14px", fontWeight: 700, background: "#0f766e", color: "white", border: "none", borderRadius: "12px", cursor: "pointer" }}
                >
                  הדפס הכל
                </button>
                <button onClick={() => setShowDeleteAllOrdersConfirm(true)} style={{ ...redButton, padding: "6px 12px", fontSize: "14px", background: "#dc2626" }}>מחק הכל</button>
                <button onClick={() => setShowAllOrdersModal(false)} style={{ padding: "6px 12px", fontSize: "14px", background: "#6b7280", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>סגור</button>
              </div>
              <h3 style={{ margin: 0 }}>
                {allOrdersFilterDayId
                  ? `הזמנות: ${saleDays.find(d => d.id === allOrdersFilterDayId)?.name ?? ""}`
                  : "מערכת 'להדר'"}
              </h3>
            </div>

            {showDeleteAllOrdersConfirm && (
              <div style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center",
                alignItems: "center", zIndex: 10000,
              }}>
                <div style={{
                  background: "white", borderRadius: "16px", padding: "32px 28px",
                  width: "360px", maxWidth: "90%", textAlign: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}>
                  <p style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>מחיקת כל ההזמנות</p>
                  <p style={{ color: "#6b7280", marginBottom: "24px" }}>
                    {allOrdersFilterDayId
                      ? `האם אתה בטוח שברצונך למחוק את כל ההזמנות של יום "${saleDays.find(d => d.id === allOrdersFilterDayId)?.name}"?`
                      : "האם אתה בטוח שברצונך למחוק את כל ההזמנות מכל ימי המכירה?"}
                  </p>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button
                      onClick={() => {
                        setSaleDays(prev => prev.map(day => {
                          if (allOrdersFilterDayId === null || day.id === allOrdersFilterDayId) {
                            return { ...day, preOrders: [] };
                          }
                          return day;
                        }));
                        setShowDeleteAllOrdersConfirm(false);
                      }}
                      style={{ ...redButton, padding: "10px 24px" }}
                    >
                      כן, מחק הכל
                    </button>
                    <button
                      onClick={() => setShowDeleteAllOrdersConfirm(false)}
                      style={{ ...blueButton, padding: "10px 24px" }}
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              placeholder="חיפוש לפי שם או טלפון..."
              value={allOrdersSearch}
              onChange={e => setAllOrdersSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: "16px", direction: "rtl", textAlign: "right" }}
              autoFocus
            />

            <div style={{ overflowY: "auto", flex: 1 }}>
              {(() => {
                const daysToShow = allOrdersFilterDayId
                  ? saleDays.filter(d => d.id === allOrdersFilterDayId)
                  : saleDays.filter(d => d.type === "preorder");

                const allOrders = daysToShow.flatMap(d =>
                  d.preOrders
                    .filter(order => {
                      if (!allOrdersSearch.trim()) return true;
                      const digits = allOrdersSearch.replace(/\D/g, "");
                      if (/^[0-9]+$/.test(allOrdersSearch.trim())) {
                        return order.customerPhone.replace(/\D/g, "").startsWith(digits);
                      }
                      return nameMatch(order.customerName, allOrdersSearch.trim());
                    })
                    .map(order => ({ order, dayName: d.name, dayId: d.id }))
                );

                if (allOrders.length === 0) {
                  return <div style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>אין הזמנות להצגה</div>;
                }

                return allOrders.map(({ order, dayName, dayId }) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      style={{
                        borderRadius: "10px",
                        background: order.status === "paid" ? "#f0fdf4" : "#f8fafc",
                        border: `1px solid ${order.status === "paid" ? "#bbf7d0" : "#e2e8f0"}`,
                        marginBottom: "8px",
                        overflow: "hidden",
                      }}
                    >
                      {/* שורה ראשית — תמיד מוצגת */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "10px 14px", cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => printSingleOrder(order, dayName)}
                            style={{ padding: "6px 10px", fontSize: "12px", fontWeight: 700, background: "#0f766e", color: "white", border: "none", borderRadius: "12px", cursor: "pointer" }}
                          >הדפס</button>
                          {order.status === "pending" && (
                            <>
                              <button
                                onClick={() => { setShowAllOrdersModal(false); openPreOrderForm(dayId, order); }}
                                style={{ ...blueButton, padding: "6px 10px", fontSize: "12px" }}
                              >ערוך</button>
                              <button
                                onClick={() => deletePreOrder(dayId, order.id)}
                                style={{ ...redButton, padding: "6px 10px", fontSize: "12px" }}
                              >מחק</button>
                            </>
                          )}
                        </div>
                        <div style={{ flex: 1, textAlign: "right" }}>
                          <span style={{ fontWeight: "bold" }}>{order.customerName}</span>
                          {order.customerPhone && <span style={{ color: "#6b7280", fontSize: "13px", marginRight: "8px" }}> {order.customerPhone}</span>}
                          {order.status === "paid" && <span style={{ color: "#16a34a", fontSize: "13px", marginRight: "8px" }}> ✓ שולם</span>}
                        </div>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      {/* פרטי הזמנה — מוצגים רק בלחיצה */}
                      {isExpanded && (
                        <div style={{ padding: "0 14px 12px", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                          {!allOrdersFilterDayId && <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>יום מכירה: {dayName}</div>}
                          <div style={{ fontSize: "12px", color: "#374151", marginTop: "6px" }}>
                            {order.items.map(i => `${i.name} x${i.qty}`).join(" | ")}
                          </div>
                          {order.notes && <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>{order.notes}</div>}
                          <div style={{ fontSize: "13px", fontWeight: "bold", marginTop: "6px" }}>
                            ₪{order.items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
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
                <button onClick={() => setShowReturnModal(false)} style={{ background: "#6b7280", color: "white", border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer" }}>סגור</button>
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
                    <button onClick={() => { setReturnSourceId(null); setReturnQtys({}); }} style={{ marginRight: "12px", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px" }}>← שנה עסקה</button>
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
                        style={{ width: "100%", padding: "12px", background: "#dc2626", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
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
              <button onClick={() => { setShowCreditModal(false); setCreditPaymentError(""); setCreditPaymentProcessing(false); }}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6b7280", lineHeight: "1" }}>✕</button>
            </div>
            <iframe
              id="NedarimFrame"
              src="https://matara.pro/nedarimplus/iframe?language=he"
              style={{ flex: 1, border: "none", width: "100%" }}
              title="תשלום באשראי"
            />
            {creditPaymentError && (
              <div style={{ padding: "10px 20px", background: "#fef2f2", color: "#dc2626", fontSize: "14px", fontWeight: 600, textAlign: "center", flexShrink: 0 }}>
                {creditPaymentError}
              </div>
            )}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", flexShrink: 0 }}>
              <button onClick={() => { setShowCreditModal(false); setCreditPaymentError(""); setCreditPaymentProcessing(false); }}
                style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                ביטול
              </button>
              <button onClick={sendCreditPayment} disabled={creditPaymentProcessing}
                style={{ flex: 2, padding: "12px", background: creditPaymentProcessing ? "#6b7280" : "#10b981", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: creditPaymentProcessing ? "not-allowed" : "pointer" }}>
                {creditPaymentProcessing ? "⏳ מעבד תשלום..." : "✓ בצע תשלום"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
