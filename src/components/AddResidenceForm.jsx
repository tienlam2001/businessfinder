// src/components/AddResidenceForm.jsx
import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Save, Loader2, PlusCircle, XCircle, ImagePlus } from 'lucide-react';
import { createDefaultBrrrInputs, mergeBrrrInputs } from '../calculations';
import { createDefaultFlipInputs, mergeFlipInputs } from '../flip';

const DATA_SOURCE_OPTIONS = [
  'County Tax Roll',
  'Skip Trace',
  'Direct Mail',
  'Broker / Agent',
  'Public Records',
  'Door Knock / D4D',
];

const FUNDING_MODES = [
  { label: 'Hard Money', value: 'hardMoney' },
  { label: 'Investor Debt', value: 'investorDebt' },
  { label: 'Investor Equity', value: 'investorEquity' },
  { label: 'All Cash', value: 'allCash' },
];

const createInitialState = () => ({
  // Property
  propertyAddress: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  propertyCounty: '',
  propertyApn: '',
  yearBuilt: '',
  squareFootage: '',
  beds: '',
  baths: '',
  lotSize: '',
  zoning: '',
  // Ownership
  ownerName: '',
  owningEntityType: 'Individual',
  llcName: '',
  ownerMailingAddress: '',
  ownerPhone: '',
  ownerEmail: '',
  dataSources: [],
  // Legacy compatibility
  phoneNumber: '',
  email: '',
  // Deal snapshot
  projectStrategy: 'BRRR',
  askingPrice: '',
  leadSource: '',
  motivation: '',
  notes: '',
  lastSalePrice: '',
  lastSaleDate: '',
  sellerName: '',
  recordedDeedLink: '',
  datePurchased: '',
  // Financial inputs
  purchasePrice: '',
  closingCosts: '',
  closingCostsPercent: '2',
  inspectionPercent: '1',
  holdingPercent: '0.5',
  rehabBudgetMode: 'percent',
  rehabBudgetPercent: '15',
  rehabBudgetAbsolute: '',
  rehabItems: [{ name: '', cost: '', category: 'Exterior' }],
  rehabContingency: '',
  rehabTimeline: '',
  arv: '',
  bridgeLtvPercent: '85',
  fundingMode: 'hardMoney',
  dscrRefiLtvPercent: '70',
  dscrRefiRatePercent: '7.25',
  dscrRefiAmortYears: '30',
  dscrRefiTarget: '1.2',
  allCashFlag: false,
  investorFundingType: 'debt',
  // Ongoing income & expenses
  rentMonthly: '',
  otherIncomeMonthly: '',
  vacancyPercent: '6',
  opExPercent: '',
  propertyTaxMode: 'dollar',
  propertyTaxPercent: '1.25',
  propertyTax: '', // This will hold the absolute dollar amount
  insuranceMode: 'dollar',
  insurancePercent: '0.75',
  insurance: '', // This will hold the absolute dollar amount
  holdingUtilities: '',
  holdingLawnSnow: '',
  holdingInsurance: '',
  marketRent: '',
  rentRoll: [{ label: 'Unit 1', rent: '' }],
  loans: [{ loanAmount: '', interestRate: '', term: '' }],
  imageUrls: [],
  brrrModel: createDefaultBrrrInputs(),
  flipModel: createDefaultFlipInputs(),
});

export default function AddResidenceForm({ onSaved, residenceToEdit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(createInitialState());
  const [imageSlots, setImageSlots] = useState(Array(8).fill(null));
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [customSource, setCustomSource] = useState('');
  const rentRollTotal = (formData.rentRoll || []).reduce(
    (sum, unit) => sum + (Number(unit.rent) || 0),
    0,
  );
  const blendedRent =
    rentRollTotal > 0
      ? rentRollTotal
      : (Number(formData.rentMonthly) || 0) +
        (Number(formData.otherIncomeMonthly) || 0);
  const rehabBudgetEstimate =
    formData.rehabBudgetMode === 'percent'
      ? (Number(formData.purchasePrice) || 0) *
        ((Number(formData.rehabBudgetPercent) || 0) / 100)
      : Number(formData.rehabBudgetAbsolute) || 0;
  const propertyTaxEstimate =
    formData.propertyTaxMode === 'percent'
      ? (Number(formData.purchasePrice) || 0) *
        ((Number(formData.propertyTaxPercent) || 0) / 100)
      : Number(formData.propertyTax) || 0;
  const insuranceEstimate =
    formData.insuranceMode === 'percent'
      ? (Number(formData.purchasePrice) || 0) *
        ((Number(formData.insurancePercent) || 0) / 100)
      : Number(formData.insurance) || 0;
  const formatCurrency = (value) =>
    Number.isFinite(value) && value > 0
      ? `$${Math.round(value).toLocaleString()}`
      : '$0';

  useEffect(() => {
    if (residenceToEdit) {
      const base = createInitialState();
      const rentRoll = residenceToEdit.rentRoll?.length
        ? residenceToEdit.rentRoll
        : base.rentRoll;
      const loans = residenceToEdit.loans?.length
        ? residenceToEdit.loans
        : base.loans;
      const rehabItems = residenceToEdit.rehabItems?.length
        ? residenceToEdit.rehabItems
        : base.rehabItems;
      const mergedModel = mergeBrrrInputs(
        residenceToEdit.brrrModel,
        createDefaultBrrrInputs(),
      );
      const ownerPhone =
        residenceToEdit.ownerPhone ||
        residenceToEdit.phoneNumber ||
        '';
      const ownerEmail =
        residenceToEdit.ownerEmail ||
        residenceToEdit.email ||
        '';
      const closingPct =
        residenceToEdit.closingCostsPercent ??
        residenceToEdit.brrrModel?.shared?.purchaseClosingPercent ??
        base.closingCostsPercent;
      const inspectionPct =
        residenceToEdit.inspectionPercent ??
        base.inspectionPercent;
      const holdingPct =
        residenceToEdit.holdingPercent ??
        base.holdingPercent;
      const rehabBudgetQuick =
        residenceToEdit.rehabBudgetQuick ??
        '';
      const legacyBeds = residenceToEdit.beds
        || (residenceToEdit.bedsBaths
          ? residenceToEdit.bedsBaths.split('/')[0]?.trim()
          : '');
      const legacyBaths = residenceToEdit.baths
        || (residenceToEdit.bedsBaths
          ? residenceToEdit.bedsBaths.split('/')[1]?.trim()
          : '');
      setFormData({
        ...base,
        ...residenceToEdit,
        rentRoll,
        loans,
        rehabItems,
        projectStrategy: residenceToEdit.projectStrategy || 'BRRR',
        fundingMode: residenceToEdit.fundingMode || base.fundingMode,
        ownerPhone,
        phoneNumber: ownerPhone,
        ownerEmail,
        email: ownerEmail,
        dataSources: residenceToEdit.dataSources || [],
        owningEntityType:
          residenceToEdit.owningEntityType || base.owningEntityType,
        propertyCity: residenceToEdit.propertyCity || '',
        propertyState: residenceToEdit.propertyState || '',
        propertyZip: residenceToEdit.propertyZip || '',
        propertyCounty: residenceToEdit.propertyCounty || '',
        propertyApn: residenceToEdit.propertyApn || '',
        beds: legacyBeds || '',
        baths: legacyBaths || '',
        rentMonthly:
          residenceToEdit.rentMonthly ||
          (residenceToEdit.marketRent || ''),
        otherIncomeMonthly: residenceToEdit.otherIncomeMonthly || '',
        vacancyPercent:
          residenceToEdit.vacancyPercent !== undefined &&
          residenceToEdit.vacancyPercent !== null
            ? String(residenceToEdit.vacancyPercent)
            : base.vacancyPercent,
        opExPercent:
          residenceToEdit.opExPercent !== undefined &&
          residenceToEdit.opExPercent !== null
            ? String(residenceToEdit.opExPercent)
            : base.opExPercent,
        closingCostsPercent:
          closingPct !== undefined && closingPct !== null
            ? String(closingPct)
            : base.closingCostsPercent,
        inspectionPercent:
          inspectionPct !== undefined && inspectionPct !== null
            ? String(inspectionPct)
            : base.inspectionPercent,
        holdingPercent:
          holdingPct !== undefined && holdingPct !== null
            ? String(holdingPct)
            : base.holdingPercent,
        rehabBudgetMode:
          residenceToEdit.rehabBudgetMode || base.rehabBudgetMode,
        rehabBudgetPercent:
          residenceToEdit.rehabBudgetPercent !== undefined &&
          residenceToEdit.rehabBudgetPercent !== null
            ? String(residenceToEdit.rehabBudgetPercent)
            : base.rehabBudgetPercent,
        rehabBudgetAbsolute: rehabBudgetQuick ? String(rehabBudgetQuick) : '',
        bridgeLtvPercent:
          residenceToEdit.bridgeLtvPercent !== undefined &&
          residenceToEdit.bridgeLtvPercent !== null
            ? String(residenceToEdit.bridgeLtvPercent)
            : residenceToEdit.brrrModel?.hardMoney?.ltvPercent !== undefined
              ? String(residenceToEdit.brrrModel.hardMoney.ltvPercent)
              : base.bridgeLtvPercent,
        dscrRefiLtvPercent:
          residenceToEdit.dscrRefiLtvPercent !== undefined &&
          residenceToEdit.dscrRefiLtvPercent !== null
            ? String(residenceToEdit.dscrRefiLtvPercent)
            : residenceToEdit.brrrModel?.dscrRefi?.maxLtvPercent !== undefined
              ? String(residenceToEdit.brrrModel.dscrRefi.maxLtvPercent)
              : base.dscrRefiLtvPercent,
        dscrRefiRatePercent:
          residenceToEdit.dscrRefiRatePercent !== undefined &&
          residenceToEdit.dscrRefiRatePercent !== null
            ? String(residenceToEdit.dscrRefiRatePercent)
            : residenceToEdit.brrrModel?.dscrRefi?.ratePercent !== undefined
              ? String(residenceToEdit.brrrModel.dscrRefi.ratePercent)
              : base.dscrRefiRatePercent,
        dscrRefiAmortYears:
          residenceToEdit.dscrRefiAmortYears !== undefined &&
          residenceToEdit.dscrRefiAmortYears !== null
            ? String(residenceToEdit.dscrRefiAmortYears)
            : residenceToEdit.brrrModel?.dscrRefi?.amortYears !== undefined
              ? String(residenceToEdit.brrrModel.dscrRefi.amortYears)
              : base.dscrRefiAmortYears,
        dscrRefiTarget:
          residenceToEdit.dscrRefiTarget !== undefined &&
          residenceToEdit.dscrRefiTarget !== null
            ? String(residenceToEdit.dscrRefiTarget)
            : residenceToEdit.brrrModel?.dscrRefi?.dscrTarget !== undefined
              ? String(residenceToEdit.brrrModel.dscrRefi.dscrTarget)
              : base.dscrRefiTarget,
        allCashFlag:
          typeof residenceToEdit.allCashFlag === 'boolean'
            ? residenceToEdit.allCashFlag
            : Boolean(residenceToEdit.brrrModel?.allCash?.takeRefi),
        investorFundingType:
          residenceToEdit.investorFundingType ||
          residenceToEdit.brrrModel?.investor?.fundingType ||
          base.investorFundingType,
        brrrModel: mergedModel,
        flipModel: mergeFlipInputs(
          residenceToEdit.flipModel,
          createDefaultFlipInputs(),
        ),
      });
      const newImageSlots = Array(8).fill(null);
      if (residenceToEdit.imageUrls) {
        residenceToEdit.imageUrls.forEach((url, i) => {
          if (i < 8) newImageSlots[i] = { url, file: null };
        });
      }
      setImageSlots(newImageSlots);
    } else {
      setFormData(createInitialState());
      setImageSlots(Array(8).fill(null));
    }
    setImagesToDelete([]);
  }, [residenceToEdit, onSaved]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'ownerPhone') {
      setFormData({ ...formData, ownerPhone: value, phoneNumber: value });
      return;
    }
    if (name === 'ownerEmail') {
      setFormData({ ...formData, ownerEmail: value, email: value });
      return;
    }
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLoanChange = (index, e) => {
    const newLoans = [...formData.loans];
    newLoans[index][e.target.name] = e.target.value;
    setFormData({ ...formData, loans: newLoans });
  };

  const addLoan = () => {
    setFormData({ ...formData, loans: [...formData.loans, { loanAmount: '', interestRate: '', term: '' }] });
  };

  const removeLoan = (index) => {
    if (formData.loans.length > 1) {
      const newLoans = [...formData.loans];
      newLoans.splice(index, 1);
      setFormData({ ...formData, loans: newLoans });
    }
  };

  const handleRehabChange = (index, e) => {
    const newRehabItems = [...formData.rehabItems];
    newRehabItems[index][e.target.name] = e.target.value;
    setFormData({ ...formData, rehabItems: newRehabItems });
  };

  const addRehabItem = () => {
    setFormData({ ...formData, rehabItems: [...formData.rehabItems, { name: '', cost: '', category: 'Interior' }] });
  };

  const removeRehabItem = (index) => {
    if (formData.rehabItems.length > 1) {
      const newRehabItems = [...formData.rehabItems];
      newRehabItems.splice(index, 1);
      setFormData({ ...formData, rehabItems: newRehabItems });
    }
  };

  const handleRentRollChange = (index, field, value) => {
    const newRoll = [...formData.rentRoll];
    newRoll[index] = { ...newRoll[index], [field]: value };
    const newTotal = newRoll.reduce(
      (sum, unit) => sum + (Number(unit.rent) || 0),
      0,
    );
    setFormData({ ...formData, rentRoll: newRoll, marketRent: newTotal });
  };

  const addRentRollUnit = () => {
    setFormData({
      ...formData,
      rentRoll: [
        ...formData.rentRoll,
        { label: `Unit ${formData.rentRoll.length + 1}`, rent: '' },
      ],
    });
  };

  const removeRentRollUnit = (index) => {
    if (formData.rentRoll.length <= 1) return;
    const updated = [...formData.rentRoll];
    updated.splice(index, 1);
    const newTotal = updated.reduce(
      (sum, unit) => sum + (Number(unit.rent) || 0),
      0,
    );
    setFormData({ ...formData, rentRoll: updated, marketRent: newTotal });
  };

  const toggleDataSource = (source) => {
    setFormData((prev) => {
      const exists = prev.dataSources.includes(source);
      const dataSources = exists
        ? prev.dataSources.filter((item) => item !== source)
        : [...prev.dataSources, source];
      return { ...prev, dataSources };
    });
  };

  const handleCustomSourceAdd = () => {
    const trimmed = customSource.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      if (prev.dataSources.includes(trimmed)) return prev;
      return { ...prev, dataSources: [...prev.dataSources, trimmed] };
    });
    setCustomSource('');
  };

  const handleFundingModeSelect = (mode) => {
    setFormData((prev) => ({
      ...prev,
      fundingMode: mode,
      investorFundingType:
        mode === 'investorEquity'
          ? 'equity'
          : mode === 'investorDebt'
            ? 'debt'
            : prev.investorFundingType,
      allCashFlag: mode === 'allCash',
    }));
  };

  const handleRehabModeChange = (mode) => {
    setFormData((prev) => ({
      ...prev,
      rehabBudgetMode: mode,
    }));
  };

  const handleCostModeChange = (field, mode) => {
    setFormData((prev) => ({
      ...prev,
      [`${field}Mode`]: mode,
    }));
  };

  const handlePercentInputChange = (e) => {
    const { name, value } = e.target;
    if (/Percent$/.test(name) && (Number(value) < 0 || Number(value) > 100)) {
      return; // Prevent values outside 0-100 for percentage fields
    }
    handleChange(e);
  };
  const handleImageChange = (index, e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const newImageSlots = [...imageSlots];
      let currentSlotIndex = index;

      for (let i = 0; i < files.length; i++) {
        // Find the next available slot
        while (currentSlotIndex < newImageSlots.length && newImageSlots[currentSlotIndex] !== null) {
          currentSlotIndex++;
        }

        // If we found an available slot within the limit, fill it
        if (currentSlotIndex < 8) {
          const file = files[i];
          newImageSlots[currentSlotIndex] = { url: URL.createObjectURL(file), file: file };
          currentSlotIndex++; // Move to the next slot for the next file
        } else {
          break; // Stop if no more slots are available
        }
      }
      setImageSlots(newImageSlots);
    }
  };

  const removeImage = (index) => {
    const newImageSlots = [...imageSlots];
    const slotToRemove = newImageSlots[index];
    if (slotToRemove && slotToRemove.file === null && slotToRemove.url.startsWith('https://firebasestorage.googleapis.com')) {
      setImagesToDelete(prev => [...prev, slotToRemove.url]);
    }
    newImageSlots[index] = null;
    setImageSlots(newImageSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const purchasePrice = Number(formData.purchasePrice) || 0;
      const rehabFromToggle =
        formData.rehabBudgetMode === 'percent'
          ? purchasePrice * ((Number(formData.rehabBudgetPercent) || 0) / 100)
          : Number(formData.rehabBudgetAbsolute) || 0;
      const closingPercent = Number(formData.closingCostsPercent) || 0;
      const inspectionPercent = Number(formData.inspectionPercent) || 0;
      const holdingPercent = Number(formData.holdingPercent) || 0;
      const inspectionFixed = purchasePrice * (inspectionPercent / 100);
      const holdingMonthly = purchasePrice * (holdingPercent / 100);
      const rentMonthly = Number(formData.rentMonthly) || 0;
      const otherIncomeMonthly = Number(formData.otherIncomeMonthly) || 0;
      const combinedRent =
        rentRollTotal > 0 ? rentRollTotal : rentMonthly + otherIncomeMonthly;
      const investorFundingType =
        formData.fundingMode === 'investorEquity' ? 'equity' : 'debt';
      const isAllCash =
        formData.fundingMode === 'allCash' || Boolean(formData.allCashFlag);
      const vacancyPercent =
        formData.vacancyPercent !== ''
          ? Number(formData.vacancyPercent) || 0
          : null;
      const opExPercent =
        formData.opExPercent !== ''
          ? Number(formData.opExPercent) || null
          : null;
      const finalPropertyTax =
        formData.propertyTaxMode === 'percent'
          ? purchasePrice * ((Number(formData.propertyTaxPercent) || 0) / 100)
          : Number(formData.propertyTax) || null;

      const finalInsurance =
        formData.insuranceMode === 'percent'
          ? purchasePrice * ((Number(formData.insurancePercent) || 0) / 100)
          : Number(formData.insurance) || null;
      const rentRoll = formData.rentRoll
        .map((unit) => ({
          label: unit.label,
          rent: Number(unit.rent) || 0,
        }))
        .filter((unit) => unit.label || unit.rent > 0);
      const loans = formData.loans.filter(
        (l) => l.loanAmount || l.interestRate || l.term,
      );
      const rehabItems = formData.rehabItems
        .map((item) => ({
          ...item,
          cost: Number(item.cost) || 0,
        }))
        .filter((item) => item.name || item.cost > 0);
      const formattedAddress = [formData.propertyAddress, formData.propertyCity, formData.propertyState]
        .map((part) => (part || '').trim())
        .filter(Boolean)
        .join(', ');
      const bedsBathsLabel = [formData.beds, formData.baths]
        .filter((value) => value !== undefined && value !== '')
        .join(' / ');
      const uniqueSources = Array.from(
        new Set((formData.dataSources || []).filter(Boolean)),
      );

      const brrrOverrides = {
        shared: {
          purchasePrice,
          arv: Number(formData.arv) || 0,
          rehabBudget: rehabFromToggle || undefined,
          purchaseClosingPercent: closingPercent || undefined,
          purchaseClosingFixed: inspectionFixed || undefined,
          rehabDurationMonths: Number(formData.rehabTimeline) || undefined,
          holdingCosts: {
            taxes: (finalPropertyTax || 0) / 12,
            insurance: (finalInsurance || 0) / 12,
            utilities: holdingMonthly || Number(formData.holdingUtilities) || 0,
            hoa: 0,
          },
          marketRent: combinedRent || undefined,
          vacancyPercent: vacancyPercent ?? undefined,
          expenseRatioPercent: opExPercent ?? undefined,
          annualPropertyTax: Number(formData.propertyTax) || undefined,
          annualInsurance: Number(formData.insurance) || undefined,
        },
        hardMoney: {
          ltvPercent:
            formData.bridgeLtvPercent !== ''
              ? Number(formData.bridgeLtvPercent) || undefined
              : undefined,
        },
        investor: {
          fundingType: investorFundingType,
        },
        dscrRefi: {
          maxLtvPercent:
            formData.dscrRefiLtvPercent !== ''
              ? Number(formData.dscrRefiLtvPercent) || undefined
              : undefined,
          ratePercent:
            formData.dscrRefiRatePercent !== ''
              ? Number(formData.dscrRefiRatePercent) || undefined
              : undefined,
          amortYears:
            formData.dscrRefiAmortYears !== ''
              ? Number(formData.dscrRefiAmortYears) || undefined
              : undefined,
          termYears:
            formData.dscrRefiAmortYears !== ''
              ? Number(formData.dscrRefiAmortYears) || undefined
              : undefined,
          dscrTarget:
            formData.dscrRefiTarget !== ''
              ? Number(formData.dscrRefiTarget) || undefined
              : undefined,
        },
        allCash: {
          takeRefi: isAllCash,
        },
      };

      const flipOverrides = {
        shared: {
          purchasePrice,
          arv: Number(formData.arv) || undefined,
          closingPctPurchase: closingPercent || undefined, // This seems to be missing from flip model
          holdingMonths: Number(formData.rehabTimeline) || undefined, // This seems to be missing from flip model
          taxesAnnual: Number(formData.propertyTax) || undefined,
          insuranceAnnual: Number(formData.insurance) || undefined,
          utilitiesMonthly: Number(formData.holdingUtilities) || undefined,
          otherCarryingMonthly: Number(formData.holdingLawnSnow) || undefined,
        },
      };

      const dataToSave = {
        ...formData,
        propertyAddress: formattedAddress || formData.propertyAddress,
        purchasePrice: purchasePrice || null,
        closingCosts: Number(formData.closingCosts) || null,
        closingCostsPercent: closingPercent || null,
        inspectionPercent: inspectionPercent || null,
        holdingPercent: holdingPercent || null,
        rehabBudgetQuick: rehabFromToggle || null,
        rehabBudgetPercent:
          formData.rehabBudgetMode === 'percent'
            ? Number(formData.rehabBudgetPercent) || null
            : null,
        rehabBudgetAbsolute:
          formData.rehabBudgetMode === 'dollar'
            ? Number(formData.rehabBudgetAbsolute) || null
            : null,
        rehabTimeline: Number(formData.rehabTimeline) || null,
        askingPrice: Number(formData.askingPrice) || null,
        arv: Number(formData.arv) || null,
        rentMonthly: rentMonthly || null,
        otherIncomeMonthly: otherIncomeMonthly || null,
        vacancyPercent: vacancyPercent,
        opExPercent: opExPercent,
        holdingUtilities: holdingMonthly || null,
        holdingLawnSnow: Number(formData.holdingLawnSnow) || null,
        holdingInsurance: Number(formData.holdingInsurance) || null,
        yearBuilt: Number(formData.yearBuilt) || null,
        squareFootage: Number(formData.squareFootage) || null,
        propertyTax: finalPropertyTax,
        insurance: finalInsurance,
        projectStrategy: formData.projectStrategy || 'BRRR',
        marketRent: combinedRent,
        rentRoll,
        loans,
        rehabItems,
        propertyCity: formData.propertyCity || '',
        propertyState: formData.propertyState || '',
        propertyZip: formData.propertyZip || '',
        propertyCounty: formData.propertyCounty || '',
        propertyApn: formData.propertyApn || '',
        beds: formData.beds || '',
        baths: formData.baths || '',
        bedsBaths: bedsBathsLabel || '',
        ownerPhone: formData.ownerPhone || '',
        phoneNumber: formData.ownerPhone || '',
        ownerEmail: formData.ownerEmail || '',
        email: formData.ownerEmail || '',
        dataSources: uniqueSources,
        owningEntityType: formData.owningEntityType,
        lastSalePrice: Number(formData.lastSalePrice) || null,
        lastSaleDate: formData.lastSaleDate || '',
        sellerName: formData.sellerName || '',
        recordedDeedLink: formData.recordedDeedLink || '',
        leadSource: formData.leadSource || '',
        motivation: formData.motivation || '',
        bridgeLtvPercent:
          formData.bridgeLtvPercent !== ''
            ? Number(formData.bridgeLtvPercent) || null
            : null,
        fundingMode: formData.fundingMode,
        dscrRefiLtvPercent:
          formData.dscrRefiLtvPercent !== ''
            ? Number(formData.dscrRefiLtvPercent) || null
            : null,
        dscrRefiRatePercent:
          formData.dscrRefiRatePercent !== ''
            ? Number(formData.dscrRefiRatePercent) || null
            : null,
        dscrRefiAmortYears:
          formData.dscrRefiAmortYears !== ''
            ? Number(formData.dscrRefiAmortYears) || null
            : null,
        dscrRefiTarget:
          formData.dscrRefiTarget !== ''
            ? Number(formData.dscrRefiTarget) || null
            : null,
        allCashFlag: isAllCash,
        investorFundingType: investorFundingType,
        rentRollStrategy: rentRoll.length ? 'detailed' : 'simple',
        brrrModel: mergeBrrrInputs(
          brrrOverrides,
          formData.brrrModel || createDefaultBrrrInputs(),
        ),
        flipModel: mergeFlipInputs(
          flipOverrides,
          formData.flipModel || createDefaultFlipInputs(),
        ),
      };

      delete dataToSave.rehabBudget;

      const residenceId = residenceToEdit
        ? residenceToEdit.id
        : doc(collection(db, 'residences')).id;
      const uploadedImageUrls = [];

      for (const slot of imageSlots) {
        if (slot) {
          if (slot.file) {
            const imageRef = ref(
              storage,
              `residences/${residenceId}/${Date.now()}_${slot.file.name}`,
            );
            await uploadBytes(imageRef, slot.file);
            const downloadURL = await getDownloadURL(imageRef);
            uploadedImageUrls.push(downloadURL);
          } else if (slot.url) {
            uploadedImageUrls.push(slot.url);
          }
        }
      }
      dataToSave.imageUrls = uploadedImageUrls;

      for (const urlToDelete of imagesToDelete) {
        try {
          const imageRef = ref(storage, urlToDelete);
          await deleteObject(imageRef);
        } catch (deleteError) {
          console.warn('Could not delete image:', deleteError.message);
        }
      }

      if (residenceToEdit) {
        const residenceRef = doc(db, 'residences', residenceToEdit.id);
        await updateDoc(residenceRef, {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'residences', residenceId), {
          ...dataToSave,
          createdAt: new Date(),
        });
      }
      onSaved();
    } catch (error) {
      alert('Error saving residence: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="glass-card">
      <h2 style={{ marginTop: 0, color: 'var(--accent-cyan)' }}>{residenceToEdit ? '// EDIT RESIDENCE' : '// NEW RESIDENCE'}</h2>
      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>// OWNER / ENTITY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Owner / Entity</label><input className="modern-input" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Jane Investor / Oak Holdings LLC" /></div>
            <div className="input-group">
              <label className="input-label">Entity Type</label>
              <select className="modern-input" name="owningEntityType" value={formData.owningEntityType} onChange={handleChange}>
                <option value="Individual">Individual</option>
                <option value="LLC">LLC</option>
              </select>
            </div>
            <div className="input-group"><label className="input-label">LLC Name</label><input className="modern-input" name="llcName" value={formData.llcName} onChange={handleChange} placeholder="If different from owner" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px', marginTop: '20px' }}>
            <div className="input-group"><label className="input-label">Owner Phone</label><input className="modern-input" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} placeholder="(555) 123-4567" /></div>
            <div className="input-group"><label className="input-label">Owner Email</label><input className="modern-input" type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} placeholder="owner@email.com" /></div>
          </div>
          <div className="input-group"><label className="input-label">Mailing Address</label><input className="modern-input" name="ownerMailingAddress" value={formData.ownerMailingAddress} onChange={handleChange} placeholder="123 Any St, Suite 100" /></div>
          <div className="input-group">
            <label className="input-label">Data Sources</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {DATA_SOURCE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => toggleDataSource(option)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: '1px solid var(--glass-border)',
                    background: formData.dataSources.includes(option) ? 'var(--accent-purple)' : 'transparent',
                    color: formData.dataSources.includes(option) ? '#0b1120' : 'var(--text-primary)',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: '10px', gap: '10px', flexWrap: 'wrap' }}>
              <input className="modern-input" placeholder="Add custom source" value={customSource} onChange={(e) => setCustomSource(e.target.value)} />
              <button type="button" className="btn-modern-subtle" onClick={handleCustomSourceAdd}>Add</button>
            </div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '15px' }}>// PROPERTY SNAPSHOT</h3>
          <div className="input-group"><label className="input-label">Street Address</label><input className="modern-input" name="propertyAddress" value={formData.propertyAddress} required onChange={handleChange} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">City</label><input className="modern-input" name="propertyCity" value={formData.propertyCity} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">State</label><input className="modern-input" name="propertyState" value={formData.propertyState} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">ZIP</label><input className="modern-input" name="propertyZip" value={formData.propertyZip} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">County</label><input className="modern-input" name="propertyCounty" value={formData.propertyCounty} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">APN</label><input className="modern-input" name="propertyApn" value={formData.propertyApn} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Year Built</label><input className="modern-input" type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Square Footage</label><input className="modern-input" type="number" name="squareFootage" value={formData.squareFootage} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Beds</label><input className="modern-input" name="beds" value={formData.beds} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Baths</label><input className="modern-input" name="baths" value={formData.baths} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Lot Size</label><input className="modern-input" name="lotSize" value={formData.lotSize} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Zoning</label><input className="modern-input" name="zoning" value={formData.zoning} onChange={handleChange} /></div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>// ACQUISITION HISTORY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Date Purchased</label><input className="modern-input" type="date" name="datePurchased" value={formData.datePurchased} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Last Sale Price ($)</label><input className="modern-input" type="number" name="lastSalePrice" value={formData.lastSalePrice} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Last Sale Date</label><input className="modern-input" type="date" name="lastSaleDate" value={formData.lastSaleDate} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Recorded Closing Costs ($)</label><input className="modern-input" type="number" name="closingCosts" value={formData.closingCosts} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Seller / Transfer</label><input className="modern-input" name="sellerName" value={formData.sellerName} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Recorded Deed Link</label><input className="modern-input" type="url" name="recordedDeedLink" value={formData.recordedDeedLink} onChange={handleChange} placeholder="https://..." /></div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-green)', marginBottom: '15px' }}>// DEAL PIPELINE</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Asking Price ($)</label><input className="modern-input" type="number" name="askingPrice" value={formData.askingPrice} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Lead Source</label><input className="modern-input" name="leadSource" value={formData.leadSource} onChange={handleChange} placeholder="Outbound, inbound, referral..." /></div>
            <div className="input-group"><label className="input-label">Seller Motivation</label><input className="modern-input" name="motivation" value={formData.motivation} onChange={handleChange} /></div>
            <div className="input-group">
              <label className="input-label">Project Strategy</label>
              <select className="modern-input" name="projectStrategy" value={formData.projectStrategy} onChange={handleChange}>
                <option value="BRRR">BRRR</option>
                <option value="Flip">Flip</option>
                <option value="Rental">Rental</option>
              </select>
            </div>
          </div>
          <div className="input-group"><label className="input-label">Working Notes</label><textarea className="modern-input" rows="3" name="notes" value={formData.notes} onChange={handleChange} /></div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '15px' }}>// BRRR INPUTS</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Estimated Rehab</span><strong>{formatCurrency(rehabBudgetEstimate)}</strong></div>
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Blended Rent</span><strong>{formatCurrency(blendedRent)}</strong></div>
            <div style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}><span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Holding (monthly)</span><strong>{formatCurrency((Number(formData.purchasePrice) || 0) * ((Number(formData.holdingPercent) || 0) / 100))}</strong></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Purchase Price ($)</label><input className="modern-input" type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">After Repair Value ($)</label><input className="modern-input" type="number" name="arv" value={formData.arv} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Rehab Timeline (months)</label><input className="modern-input" type="number" name="rehabTimeline" value={formData.rehabTimeline} onChange={handleChange} /></div>
          </div>
          <div className="input-group">
            <label className="input-label">Rehab Budget Entry</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleRehabModeChange('percent')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.rehabBudgetMode === 'percent' ? 'var(--accent-green)' : 'transparent', color: formData.rehabBudgetMode === 'percent' ? '#0b1120' : 'var(--text-primary)' }}>% of Purchase</button>
              <button type="button" onClick={() => handleRehabModeChange('dollar')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.rehabBudgetMode === 'dollar' ? 'var(--accent-green)' : 'transparent', color: formData.rehabBudgetMode === 'dollar' ? '#0b1120' : 'var(--text-primary)' }}>$ Amount</button>
            </div>
            {formData.rehabBudgetMode === 'percent' ? (
              <input className="modern-input" type="number" step="0.1" name="rehabBudgetPercent" value={formData.rehabBudgetPercent} onChange={handleChange} placeholder="Percent of purchase" />
            ) : (
              <input className="modern-input" type="number" name="rehabBudgetAbsolute" value={formData.rehabBudgetAbsolute} onChange={handleChange} placeholder="Total rehab dollars" />
            )}
            <small style={{ color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>Est. Rehab Budget: {formatCurrency(rehabBudgetEstimate)}</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Closing Costs %</label><input className="modern-input" type="number" step="0.1" name="closingCostsPercent" value={formData.closingCostsPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Inspection / Misc %</label><input className="modern-input" type="number" step="0.1" name="inspectionPercent" value={formData.inspectionPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Holding Monthly %</label><input className="modern-input" type="number" step="0.1" name="holdingPercent" value={formData.holdingPercent} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">Property Tax Entry</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button type="button" onClick={() => handleCostModeChange('propertyTax', 'percent')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.propertyTaxMode === 'percent' ? 'var(--accent-green)' : 'transparent', color: formData.propertyTaxMode === 'percent' ? '#0b1120' : 'var(--text-primary)' }}>% of Purchase</button>
                <button type="button" onClick={() => handleCostModeChange('propertyTax', 'dollar')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.propertyTaxMode === 'dollar' ? 'var(--accent-green)' : 'transparent', color: formData.propertyTaxMode === 'dollar' ? '#0b1120' : 'var(--text-primary)' }}>$ Amount</button>
              </div>
              {formData.propertyTaxMode === 'percent' ? (
                <input className="modern-input" type="number" step="0.01" name="propertyTaxPercent" value={formData.propertyTaxPercent} onChange={handlePercentInputChange} placeholder="Tax rate %" />
              ) : (
                <input className="modern-input" type="number" name="propertyTax" value={formData.propertyTax} onChange={handleChange} placeholder="Total tax dollars / year" />
              )}
              <small style={{ color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>Est. Annual Tax: {formatCurrency(propertyTaxEstimate)}</small>
            </div>
            <div className="input-group">
              <label className="input-label">Insurance Entry</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button type="button" onClick={() => handleCostModeChange('insurance', 'percent')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.insuranceMode === 'percent' ? 'var(--accent-green)' : 'transparent', color: formData.insuranceMode === 'percent' ? '#0b1120' : 'var(--text-primary)' }}>% of Purchase</button>
                <button type="button" onClick={() => handleCostModeChange('insurance', 'dollar')} style={{ padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--glass-border)', background: formData.insuranceMode === 'dollar' ? 'var(--accent-green)' : 'transparent', color: formData.insuranceMode === 'dollar' ? '#0b1120' : 'var(--text-primary)' }}>$ Amount</button>
              </div>
              {formData.insuranceMode === 'percent' ? (
                <input className="modern-input" type="number" step="0.01" name="insurancePercent" value={formData.insurancePercent} onChange={handlePercentInputChange} placeholder="Insurance rate %" />
              ) : (
                <input className="modern-input" type="number" name="insurance" value={formData.insurance} onChange={handleChange} placeholder="Total insurance dollars / year" />
              )}
              <small style={{ color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>Est. Annual Insurance: {formatCurrency(insuranceEstimate)}</small>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Market Rent ($/mo)</label><input className="modern-input" type="number" name="rentMonthly" value={formData.rentMonthly} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Other Income ($/mo)</label><input className="modern-input" type="number" name="otherIncomeMonthly" value={formData.otherIncomeMonthly} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Vacancy %</label><input className="modern-input" type="number" step="0.1" name="vacancyPercent" value={formData.vacancyPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">OpEx %</label><input className="modern-input" type="number" step="0.1" name="opExPercent" value={formData.opExPercent} onChange={handleChange} placeholder="Leave blank to use defaults" /></div>
          </div>
          <div className="input-group">
            <label className="input-label">Funding Track</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {FUNDING_MODES.map(({ label, value }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleFundingModeSelect(value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid var(--glass-border)',
                    background: formData.fundingMode === value ? 'var(--accent-green)' : 'transparent',
                    color: formData.fundingMode === value ? '#0b1120' : 'var(--text-primary)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px' }}>
            <div className="input-group"><label className="input-label">Bridge LTV %</label><input className="modern-input" type="number" step="0.1" name="bridgeLtvPercent" value={formData.bridgeLtvPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Refi LTV %</label><input className="modern-input" type="number" step="0.1" name="dscrRefiLtvPercent" value={formData.dscrRefiLtvPercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Refi Rate %</label><input className="modern-input" type="number" step="0.01" name="dscrRefiRatePercent" value={formData.dscrRefiRatePercent} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">Amort Years</label><input className="modern-input" type="number" name="dscrRefiAmortYears" value={formData.dscrRefiAmortYears} onChange={handleChange} /></div>
            <div className="input-group"><label className="input-label">DSCR Min</label><input className="modern-input" type="number" step="0.05" name="dscrRefiTarget" value={formData.dscrRefiTarget} onChange={handleChange} /></div>
          </div>
        </section>

        <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.3, marginBottom: '30px' }} />

        <h3 style={{ color: 'var(--accent-green)' }}>// REHAB DETAIL (OPTIONAL)</h3>
        {formData.rehabItems.map((item, index) => (
          <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '10px', position: 'relative' }}>
            {formData.rehabItems.length > 1 && <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeRehabItem(index)} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px' }}>
              <div className="input-group"><label className="input-label">Category</label><select className="modern-input" name="category" value={item.category} onChange={(e) => handleRehabChange(index, e)}><option>Exterior</option><option>Interior</option><option>General</option><option>Permits</option></select></div>
              <div className="input-group"><label className="input-label">Item Name</label><input className="modern-input" name="name" value={item.name} onChange={(e) => handleRehabChange(index, e)} /></div>
              <div className="input-group"><label className="input-label">Cost ($)</label><input className="modern-input" type="number" name="cost" value={item.cost} onChange={(e) => handleRehabChange(index, e)} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addRehabItem} className="btn-modern-subtle" style={{ marginBottom: '20px' }}><PlusCircle size={16} /> Add Rehab Item</button>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />
        <h3 style={{ color: 'var(--accent-green)' }}>// RENT ROLL</h3>
        {formData.rentRoll.map((unit, index) => (
          <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '10px', position: 'relative' }}>
            {formData.rentRoll.length > 1 && (
              <XCircle
                color="#f87171"
                size={20}
                style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }}
                onClick={() => removeRentRollUnit(index)}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Unit / Space</label>
                <input
                  className="modern-input"
                  value={unit.label}
                  onChange={(e) => handleRentRollChange(index, 'label', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Rent ($/month)</label>
                <input
                  className="modern-input"
                  type="number"
                  value={unit.rent}
                  onChange={(e) => handleRentRollChange(index, 'rent', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn-modern-subtle" onClick={addRentRollUnit} style={{ marginBottom: '20px' }}>
          <PlusCircle size={16} /> Add Unit
        </button>
        <div className="input-group">
          <label className="input-label">Market Rent (auto)</label>
          <input className="modern-input" value={rentRollTotal} readOnly />
        </div>

        {/* Loan Info */}
        <h3 style={{ color: 'var(--accent-purple)' }}>// CAPITAL STACK</h3>
        {formData.loans.map((loan, index) => (
          <div key={index} className="owner-group" style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '15px', marginBottom: '20px', position: 'relative' }}>
            {formData.loans.length > 1 && <XCircle color="#f87171" size={20} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => removeLoan(index)} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div className="input-group"><label className="input-label">Loan Amount ($)</label><input className="modern-input" type="number" name="loanAmount" value={loan.loanAmount} onChange={(e) => handleLoanChange(index, e)} /></div>
              <div className="input-group"><label className="input-label">Interest Rate (%)</label><input className="modern-input" type="number" name="interestRate" value={loan.interestRate} onChange={(e) => handleLoanChange(index, e)} /></div>
              <div className="input-group"><label className="input-label">Term (years)</label><input className="modern-input" type="number" name="term" value={loan.term} onChange={(e) => handleLoanChange(index, e)} /></div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addLoan} className="btn-modern-subtle" style={{ marginBottom: '20px' }}><PlusCircle size={16} /> Add Loan</button>

        <hr style={{ borderColor: 'var(--glass-border)', margin: '30px 0', opacity: 0.3 }} />

        {/* Image Upload */}
        <h3 style={{ color: 'var(--accent-purple)' }}>// IMAGES (UP TO 8)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {imageSlots.map((slot, index) => (
            <div key={index} className="image-slot">
              {slot ? (
                <>
                  <img src={slot.url} alt={`Upload preview ${index + 1}`} />
                  <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}><XCircle size={20} /></button>
                </>
              ) : (
                <label className="upload-label">
                  <ImagePlus size={30} />
                  <span>Add Image</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(index, e)} />
                </label>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="btn-modern" disabled={loading} style={{ width: '100%', marginTop: '30px', fontSize: '1.1rem' }}>
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {residenceToEdit ? 'UPDATE RESIDENCE' : 'SAVE RESIDENCE'}</>}
        </button>
      </form>
    </div>
  );
}
