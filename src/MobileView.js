import React, { useState, useEffect, useCallback, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './MobileView.css';
import SelectedRooms from './SelectedRooms';

function MobileView({ currentDay, currentDate, currentDateTime, dayStyle, prices, shortStayPrices }) {
  // List of booked room numbers
  const [bookedRooms, setBookedRooms] = useState([225, 209, 220, 222, 201, 215, 211]);
  // State for selected rooms
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // State for voice search
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // State for draggable voice button position
  const [buttonPosition, setButtonPosition] = useState({ x: 20, y: window.innerHeight - 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  // New state for multiple room results
  const [multipleRoomResults, setMultipleRoomResults] = useState([]);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [voiceSearchResults, setVoiceSearchResults] = useState({
    showModal: false,
    foundMatch: false,
    query: '',
    checkInDate: null,
    checkOutDate: null,
    nights: 0,
    bedType: '',
    hasJacuzzi: false,
    price: 0,
    tax: 0,
    total: 0,
    isShortStay: false,
    basePrice: 0,
    extraHours: 0,
    extraHoursCost: 0,
    cashTotal: 0,
    creditTax: 0,
    creditTotal: 0,
    dailyPrices: [],
    earlyCheckInHours: 0,
    lateCheckOutHours: 0,
    earlyCheckInCost: 0,
    lateCheckOutCost: 0,
    roomQuantity: 1,
    singleRoomPrice: 0,
    singleRoomTax: 0,
    singleRoomTotal: 0,
    invalidCombination: false,
    requestedInvalidCombination: '',
    validCombinations: {},
    refreshTimestamp: Date.now()
  });
  const [showVoiceSearchResults, setShowVoiceSearchResults] = useState(false);
  const [voiceSearchError, setVoiceSearchError] = useState(null);
  const [detectedVoiceQuery, setDetectedVoiceQuery] = useState(null);
  const [guidedVoiceSearch, setGuidedVoiceSearch] = useState({
    active: false,
    step: 1,
    roomType: null,
    bedType: null,
    stayDuration: null,
    specificDate: null,
    exactQuery: ''
  });
  
  // Reference to store the speech recognition instance
  const recognitionRef = useRef(null);
  
  // Effect to clean up speech recognition on unmount
  useEffect(() => {
    // This effect ensures we handle app state changes appropriately
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App moving to background, stop any active recognition
        if (isListening) {
          console.log('App going to background, stopping recognition');
          stopVoiceRecognition();
        }
      }
    };

    // Listen for visibility changes (app going to background)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up a safety timer to check and force-stop if button stays active too long
    let safetyTimer = null;
    
    if (isListening) {
      console.log('Setting up safety timer for voice recognition');
      safetyTimer = setTimeout(() => {
        // If we're still listening after the safety timeout, force stop
        if (isListening) {
          console.log('Safety timeout: forcing voice recognition to stop');
          stopVoiceRecognition();
        }
      }, 30000); // 30 seconds safety timeout
    }

    // Cleanup when component unmounts or state changes
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (safetyTimer) clearTimeout(safetyTimer);
      if (isListening) {
        stopVoiceRecognition();
      }
    };
  }, [isListening]);

  // Load selected rooms from local storage on component mount
  useEffect(() => {
    try {
      const storedRooms = localStorage.getItem('selectedRooms');
      if (storedRooms) {
        setSelectedRooms(JSON.parse(storedRooms));
      }
    } catch (error) {
      console.error('Error loading rooms from local storage:', error);
    }
    
    // Skip automatic microphone permission checks
    // Users will only be prompted when they explicitly use voice features
    if (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)) {
      // Set flag to indicate we're skipping auto permission checks
      localStorage.setItem('micPermissionHandled', 'true');
      console.log('Microphone permission checks disabled - will only request when user activates voice feature');
      
      // No automatic permission checks for any device
      // Permission will only be requested when voice features are explicitly used
    }
  }, []);  
  
  // Save selected rooms to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
    } catch (error) {
      console.error('Error saving rooms to local storage:', error);
    }
  }, [selectedRooms]);
  const [activeFloor, setActiveFloor] = useState('ground'); // 'ground' or 'first'
  
  // State for saved stays
  const [savedStays, setSavedStays] = useState([]);
  // State for active tab
  const [activeTab, setActiveTab] = useState('short');
  
  // State for tooltip
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Short stay state
  const [checkoutTime, setCheckoutTime] = useState('');
  const [extraHours, setExtraHours] = useState(0);
  const [hasJacuzzi, setHasJacuzzi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [extraHourRate, setExtraHourRate] = useState(15);
  const [totalPrice, setTotalPrice] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [extraHoursCost, setExtraHoursCost] = useState(0);
  const [isSmoking, setIsSmoking] = useState(false);
  const [bedType, setBedType] = useState('Queen');
  
  // Overnight stay state
  const [overnightSmoking, setOvernightSmoking] = useState(false);
  const [overnightPayment, setOvernightPayment] = useState('cash');
  const [overnightRateType, setOvernightRateType] = useState('regular');
  const [overnightExtraHours, setOvernightExtraHours] = useState(0);
  const [overnightCheckoutExtraHours, setOvernightCheckoutExtraHours] = useState(0);
  const [hasJacuzziOvernight, setHasJacuzziOvernight] = useState(false);
  const [overnightBedType, setOvernightBedType] = useState('Queen');
  
  // State for price summary visibility
  const [showShortStayPriceSummary, setShowShortStayPriceSummary] = useState(true);
  const [showOvernightPriceSummary, setShowOvernightPriceSummary] = useState(true);
  
  // Current time state variables
  const [currentTime, setCurrentTime] = useState('');
  const [formattedCurrentDate, setFormattedCurrentDate] = useState('');
  
  // Default check-in date (today at 3 PM)
  const defaultCheckIn = new Date();
  defaultCheckIn.setHours(15, 0, 0, 0);
  
  // Default checkout date (tomorrow at 11 AM)
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
  defaultCheckOut.setHours(11, 0, 0, 0);
  
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  
  // Update current date and time - EXACT COPY from pricecalculator project
  const updateCurrentDateTime = () => {
    const now = new Date();
    
    // Format date
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setFormattedCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    
    // Format time WITH seconds - EXACT COPY from pricecalculator
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    setCurrentTime(timeString);
    
    // Also update checkout time when current time changes - EXACT COPY from pricecalculator
    calculateCheckoutTime(now);
  };
  
  // Calculate checkout time - EXACT COPY from pricecalculator project
  const calculateCheckoutTime = (currentTimeDate = null) => {
    const now = currentTimeDate || new Date();
    const checkoutDate = new Date(now.getTime() + ((4 + extraHours) * 60 * 60 * 1000));
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    setCheckoutTime(checkoutDate.toLocaleTimeString('en-US', timeOptions));
  };
  
  // Calculate short stay price
  const calculateShortStayPrice = useCallback(() => {
    // Base rate depends on jacuzzi
    const baseRate = hasJacuzzi 
      ? shortStayPrices.baseRate.withJacuzzi 
      : shortStayPrices.baseRate.withoutJacuzzi;
    
    // Extra hour rate depends on selected rate type
    const hourlyRate = extraHourRate;
    
    // Calculate extra hours cost separately
    const extraHoursCost = extraHours * hourlyRate;
    
    // Calculate tax (15% only for credit card payments, no tax for cash)
    // Apply tax to both base rate and extra hours for credit card payments
    let taxAmount = 0;
    if (paymentMethod === 'credit') {
      // Apply 15% tax to both base rate and extra hours
      taxAmount = (baseRate + extraHoursCost) * 0.15;
    }
    
    // Total is base + extra hours + tax
    const total = baseRate + extraHoursCost + taxAmount;
    
    setTotalPrice(total);
    setTaxAmount(taxAmount);
    setBasePrice(baseRate);
    setExtraHoursCost(extraHoursCost);
    
    // We'll handle showing the price summary in a useEffect
  }, [hasJacuzzi, extraHours, extraHourRate, paymentMethod, shortStayPrices]);
  
  // Function to update early check-in time display
  const updateEarlyCheckInTime = useCallback((hours) => {
    // Force a re-render of the component
    setOvernightExtraHours(hours);
    // Show price summary
    setShowOvernightPriceSummary(true);
  }, []);
  
  // Function to update late check-out time display
  const updateLateCheckOutTime = useCallback((hours) => {
    // Force a re-render of the component
    setOvernightCheckoutExtraHours(hours);
    // Show price summary
    setShowOvernightPriceSummary(true);
  }, []);
  
  // Calculate overnight stay price
  const calculateOvernightPrice = useCallback(() => {
    if (!checkInDate || !checkOutDate) return { totalPrice: 0 };
    
    // Calculate number of nights
    const oneDay = 24 * 60 * 60 * 1000;
    const nights = Math.round(Math.abs((checkOutDate - checkInDate) / oneDay));
    
    // Get day breakdown for pricing
    const daysBreakdown = {
      weekday: 0,
      friday: 0,
      weekend: 0
    };
    
    // Define room prices based on jacuzzi option
    const roomPrices = hasJacuzziOvernight ? 
      { weekday: prices.weekday.withJacuzzi, friday: prices.friday.withJacuzzi, weekend: prices.weekend.withJacuzzi } :
      { weekday: prices.weekday.withoutJacuzzi, friday: prices.friday.withoutJacuzzi, weekend: prices.weekend.withoutJacuzzi };
    
    // Clone check-in date to iterate through days
    const currentDate = new Date(checkInDate);
    
    // Track daily prices for breakdown
    const dailyPrices = [];
    
    // Count each day type
    for (let i = 0; i < nights; i++) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let dayPrice = 0;
      
      if (dayOfWeek === 5) { // Friday
        daysBreakdown.friday++;
        dayPrice = roomPrices.friday;
      } else if (dayOfWeek === 6) { // Saturday only
        daysBreakdown.weekend++;
        dayPrice = roomPrices.weekend;
      } else { // Weekday (including Sunday)
        daysBreakdown.weekday++;
        dayPrice = roomPrices.weekday;
      }
      
      // Add room type surcharge
      if (overnightBedType === 'King') {
        dayPrice += 5; // $5 extra per night for King
      } else if (overnightBedType === 'Queen2Beds') {
        dayPrice += 10; // $10 extra per night for Queen 2 Beds
      }
      
      // Add to daily prices array
      dailyPrices.push({
        date: dateString,
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        price: dayPrice
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate base price based on days
    let totalBasePrice = 
      (daysBreakdown.weekday * roomPrices.weekday) +
      (daysBreakdown.friday * roomPrices.friday) +
      (daysBreakdown.weekend * roomPrices.weekend);
    
    // Add extra charge per night based on room type
    if (overnightBedType === 'King') {
      // $5 extra per night for King
      totalBasePrice += 5 * nights;
    } else if (overnightBedType === 'Queen2Beds') {
      // $10 extra per night for Queen 2 Beds
      totalBasePrice += 10 * nights;
    }
    
    // Calculate extra hours cost first
    const hourlyRate = overnightRateType === 'regular' ? 
      shortStayPrices.extraHourRate.regular : 
      shortStayPrices.extraHourRate.discounted;
    
    // For early check-in, overnightExtraHours is negative, so we need to use Math.abs
    const extraHoursCheckInCost = Math.abs(overnightExtraHours) * hourlyRate;
    const extraHoursCheckOutCost = overnightCheckoutExtraHours * hourlyRate;
    const totalExtraHoursCost = extraHoursCheckInCost + extraHoursCheckOutCost;
    
    // Calculate tax based on payment method - apply tax to both base price and extra hours
    const taxAmount = (totalBasePrice + totalExtraHoursCost) * 0.15;
    
    // Calculate total
    const totalPrice = totalBasePrice + taxAmount + extraHoursCheckInCost + extraHoursCheckOutCost;
    
    // We'll handle showing the price summary in a useEffect
    
    return {
      nights,
      daysBreakdown,
      dailyPrices,
      totalBasePrice,
      taxAmount,
      extraHoursCheckInCost,
      extraHoursCheckOutCost,
      totalPrice
    };
  }, [checkInDate, checkOutDate, hasJacuzziOvernight, overnightBedType, overnightExtraHours, overnightCheckoutExtraHours, overnightRateType, overnightPayment, prices, shortStayPrices]);
  
  // Handle extra hours change for short stay - simplified like in pricecalculator project
  const handleExtraHoursChange = (change) => {
    const newValue = Math.max(0, extraHours + change);
    setExtraHours(newValue);
    // Price calculation will happen in useEffect
  };
  
  // Handle overnight extra hours change
  const handleOvernightExtraHoursChange = (change) => {
    // Early check-in hours are stored as negative values
    // from -9 to 0, where -9 means 9 hours early (6:00 AM) and 0 means standard check-in (3:00 PM)
    const newValue = overnightExtraHours + change;
    // Ensure hours are within the valid range (-9 to 0)
    if (newValue >= -9 && newValue <= 0) {
      setOvernightExtraHours(newValue);
      // Show price summary
      setShowOvernightPriceSummary(true);
    }
  };
  
  // Force re-render when early check-in or late check-out hours change
  useEffect(() => {
    // This effect will run whenever overnightExtraHours changes
    // Force a recalculation of the overnight price info
    calculateOvernightPrice();
  }, [overnightExtraHours]);
  
  // Handle overnight checkout extra hours change
  const handleOvernightCheckoutExtraHoursChange = (change) => {
    setOvernightCheckoutExtraHours(prevHours => {
      // Ensure hours don't go below 0
      const newValue = Math.max(0, prevHours + change);
      // Force show price summary when changing hours
      if (newValue > 0) {
        setShowOvernightPriceSummary(true);
      }
      return newValue;
    });
  };
  
  // Force re-render when late check-out hours change
  useEffect(() => {
    // This effect will run whenever overnightCheckoutExtraHours changes
    // Force a recalculation of the overnight price info
    calculateOvernightPrice();
  }, [overnightCheckoutExtraHours]);
  
  // Calculate check-in time based on early check-in hours
  const calculateCheckInTime = (extraHours) => {
    // Default check-in time is 3:00 PM (15:00)
    // extraHours is negative for early check-in
    // e.g., -9 means 9 hours early, so 6:00 AM
    const hours = 15 + extraHours; // Add because extraHours is negative
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:00 ${ampm}`;
  };
  
  // Calculate check-out time based on late check-out hours
  const calculateCheckOutTime = (extraHours) => {
    // Default check-out time is 11:00 AM (11:00)
    const hours = 11 + extraHours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:00 ${ampm}`;
  };
  
  // Handle check-in date change
  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    
    // Ensure checkout is at least one day after check-in
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(11, 0, 0, 0);
    
    if (checkOutDate < nextDay) {
      setCheckOutDate(nextDay);
    }
  };
  
  // Handle checkout date change
  const handleCheckOutChange = (date) => {
    setCheckOutDate(date);
  };
  
  // Calculate daily price based on current day
  const getDailyPrice = useCallback(() => {
    const day = currentDateTime.getDay();
    
    if (day === 5) { // Friday
      return { regular: prices.friday.withoutJacuzzi, jacuzzi: prices.friday.withJacuzzi };
    } else if (day === 6) { // Saturday only
      return { regular: prices.weekend.withoutJacuzzi, jacuzzi: prices.weekend.withJacuzzi };
    } else { // Weekday (including Sunday)
      return { regular: prices.weekday.withoutJacuzzi, jacuzzi: prices.weekday.withJacuzzi };
    }
  }, [currentDateTime, prices]);
  
  // Initialize date and time on component mount and set up timer - EXACT COPY from pricecalculator
  useEffect(() => {
    updateCurrentDateTime(); // Initial update
    
    // Set up timer to update every second
    const timer = setInterval(() => {
      updateCurrentDateTime();
    }, 1000);
    
    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Update calculations when relevant state changes - EXACT COPY from pricecalculator
  useEffect(() => {
    calculateCheckoutTime();
    calculateShortStayPrice();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraHours, hasJacuzzi, paymentMethod, extraHourRate, currentTime]);
  
  // Clear short stay selections (but keep selected rooms)
  const clearShortStay = () => {
    // Keep selected rooms intact
    setExtraHours(0);
    setBasePrice(0);
    setExtraHoursCost(0);
    setTaxAmount(0);
    setTotalPrice(0);
    setHasJacuzzi(false);
    setIsSmoking(false);
    setBedType('');
    setPaymentMethod('cash');
    calculateCheckoutTime();
    setShowShortStayPriceSummary(false);
    
    // Keep selected rooms in local storage
    try {
      localStorage.setItem('selectedRooms', JSON.stringify(selectedRooms));
    } catch (error) {
      console.error('Error clearing rooms from local storage:', error);
    }
  };
  
  // Clear only short stay and multiple night prices, but keep room cards
  const clearAllRooms = () => {
    // Clear short stay selections but keep selected rooms
    clearShortStay();
    
    // Clear overnight stay selections but keep selected rooms
    clearOvernightStay();
    
    // Log the action
    console.log('Cleared short stay and multiple night prices, kept room cards');
  };
  
  // Clear overnight stay selections (but keep selected rooms)
  const clearOvernightStay = () => {
    // Reset to default check-in date (today at 3 PM)
    const defaultCheckIn = new Date();
    defaultCheckIn.setHours(15, 0, 0, 0);
    
    // Reset to default checkout date (tomorrow at 11 AM)
    const defaultCheckOut = new Date(defaultCheckIn);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
    defaultCheckOut.setHours(11, 0, 0, 0);
    
    setCheckInDate(defaultCheckIn);
    setCheckOutDate(defaultCheckOut);
    setOvernightExtraHours(0);
    setOvernightCheckoutExtraHours(0);
    setHasJacuzziOvernight(false);
    setOvernightSmoking(false);
    setOvernightPayment('cash');
    setOvernightRateType('regular');
    setOvernightBedType('Queen');
    setShowOvernightPriceSummary(false);
    
    // Keep selected rooms in local storage and state
    // try {
    //   localStorage.removeItem('selectedRooms');
    //   setSelectedRooms([]);
    // } catch (error) {
    //   console.error('Error clearing rooms from local storage:', error);
    // }
  };
  
  // Calculate overnight price info
  const overnightPriceInfo = calculateOvernightPrice();
  
  // Get daily prices
  const dailyPrices = getDailyPrice();
  
  // Show short stay price summary when total price changes
  useEffect(() => {
    if (totalPrice > 0) {
      setShowShortStayPriceSummary(true);
    }
  }, [totalPrice]);
  
  // Show overnight price summary when overnight price info changes
  useEffect(() => {
    if (overnightPriceInfo.totalPrice > 0) {
      setShowOvernightPriceSummary(true);
    }
  }, [overnightPriceInfo.totalPrice]);
  
  // Generate sample available rooms if none exist
  useEffect(() => {
    if (availableRooms.length === 0) {
      const rooms = [];
      
      // Define room data according to specific room types
      const roomData = {
        // First floor (100s)
        101: { bedType: 'Queen', isSmoking: true, hasJacuzzi: false },
        102: { bedType: 'Queen', isSmoking: true, hasJacuzzi: false },
        103: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        104: { bedType: 'Queen', isSmoking: true, hasJacuzzi: false },
        105: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        106: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        107: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        108: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        109: { bedType: 'Queen', isSmoking: false, hasJacuzzi: true },
        110: { bedType: 'Queen', isSmoking: true, hasJacuzzi: true },
        111: { bedType: 'Queen', isSmoking: false, hasJacuzzi: true },
        112: { bedType: 'Queen', isSmoking: true, hasJacuzzi: true },
        114: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        119: { bedType: 'Queen', isSmoking: true, hasJacuzzi: true },
        
        // Second floor (200s)
        200: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        201: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        202: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        203: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        204: { bedType: 'Queen', isSmoking: true, hasJacuzzi: false },
        205: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        206: { bedType: 'Queen', isSmoking: true, hasJacuzzi: false },
        207: { bedType: 'Queen2Beds', isSmoking: true, hasJacuzzi: false },
        208: { bedType: 'King', isSmoking: false, hasJacuzzi: true },
        209: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        210: { bedType: 'King', isSmoking: true, hasJacuzzi: true },
        211: { bedType: 'King', isSmoking: true, hasJacuzzi: false },
        212: { bedType: 'King', isSmoking: false, hasJacuzzi: false },
        214: { bedType: 'King', isSmoking: false, hasJacuzzi: true },
        215: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        216: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        217: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        218: { bedType: 'Queen2Beds', isSmoking: false, hasJacuzzi: false },
        219: { bedType: 'Queen2Beds', isSmoking: true, hasJacuzzi: false },
        220: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        221: { bedType: 'King', isSmoking: false, hasJacuzzi: false },
        222: { bedType: 'King', isSmoking: false, hasJacuzzi: false },
        223: { bedType: 'King', isSmoking: false, hasJacuzzi: false },
        224: { bedType: 'Queen', isSmoking: false, hasJacuzzi: false },
        225: { bedType: 'King', isSmoking: false, hasJacuzzi: false }
      };
      
      // Add ground floor rooms (100s)
      Object.keys(roomData).forEach(number => {
        const roomNumber = parseInt(number);
        if (roomNumber >= 100 && roomNumber < 200) {
          rooms.push({
            id: `room-${roomNumber}`,
            number: roomNumber,
            floor: 'ground',
            isSmoking: roomData[number].isSmoking,
            hasJacuzzi: roomData[number].hasJacuzzi,
            bedType: roomData[number].bedType,
            isAvailable: true
          });
        }
      });
      
      // Add first floor rooms (200s)
      Object.keys(roomData).forEach(number => {
        const roomNumber = parseInt(number);
        if (roomNumber >= 200) {
          rooms.push({
            id: `room-${roomNumber}`,
            number: roomNumber,
            floor: 'first',
            isSmoking: roomData[number].isSmoking,
            hasJacuzzi: roomData[number].hasJacuzzi,
            bedType: roomData[number].bedType,
            isAvailable: true
          });
        }
      });
      
      setAvailableRooms(rooms);
    }
  }, [availableRooms.length]);
  
  // Handle room selection
  const handleRoomSelect = (room) => {
    // Check if room is already selected
    const isSelected = selectedRooms.some(r => r.id === room.id);
    
    // If selected, remove it; otherwise add it
    if (isSelected) {
      setSelectedRooms(selectedRooms.filter(r => r.id !== room.id));
    } else {
      setSelectedRooms([...selectedRooms, room]);
    }
  };
  
  // Handle card mouse enter for tooltip
  const handleCardMouseEnter = (room, e) => {
    // Get base price based on jacuzzi option
    let basePrice = room.hasJacuzzi ? dailyPrices.jacuzzi : dailyPrices.regular;
    
    // Add surcharge based on bed type, matching the logic in Multinights section
    if (room.bedType === 'King') {
      basePrice += 5; // $5 extra for King beds
    } else if (room.bedType === 'Queen2Beds') {
      basePrice += 10; // $10 extra for Queen 2 beds
    }
    
    const tax = basePrice * 0.15; // 15% tax
    const total = basePrice + tax;
    
    // Get the viewport width to adjust tooltip position
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 110; // Width of our tooltip
    const cursorX = e.clientX;
    
    // Adjust x position if tooltip would go off screen on the right
    let adjustedX = cursorX;
    if (cursorX + tooltipWidth > viewportWidth) {
      adjustedX = cursorX - tooltipWidth;
    }
    
    setHoveredCard({ room, basePrice, tax, total });
    setMousePos({ x: adjustedX, y: e.clientY });
  };
  
  // Handle card mouse leave
  const handleCardMouseLeave = () => {
    setHoveredCard(null);
  };
  
  // Initialize speech recognition on component mount
  useEffect(() => {
    // Pre-initialize speech recognition to avoid first-time delay
    if (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      // Just create the instance to warm up the API without starting it
      const warmupRecognition = new SpeechRecognition();
      
      // Configure it to do nothing on events to prevent accidental starting
      warmupRecognition.onstart = () => {};
      warmupRecognition.onend = () => {};
      warmupRecognition.onerror = () => {};
      
      console.log('Speech recognition pre-initialized without starting');
    }
  }, []);
  
  // Create a new instance of speech recognition for each voice search attempt
  const createNewRecognitionInstance = () => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition settings
    recognition.lang = 'en-US';
    recognition.continuous = false; // Changed to false to auto-stop when speech ends
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    
    return recognition;
  };
  
  // Start voice search
  const startGuidedVoiceSearch = () => {
    // Reset guided voice search state
    setGuidedVoiceSearch({
      active: false,
      step: 1,
      roomType: null,
      bedType: null,
      stayDuration: null,
      specificDate: null,
      exactQuery: ''
    });
    
    // Start improved voice recognition
    startImprovedVoiceRecognition();
  };
  
  // Helper function to safely stop and cleanup recognition instance
  const stopAndCleanupRecognition = (source) => {
    console.log(`Stopping and cleaning up recognition (source: ${source})`);
    if (recognitionRef.current) {
      try {
        // First try to abort which is more aggressive
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Error aborting recognition:', e);
        // If abort fails, try stop
        try {
          recognitionRef.current.stop();
        } catch (e2) {
          console.log('Error stopping recognition:', e2);
        }
      }
      
      // Clean up all event handlers
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onstart = null;
      } catch (e) {
        console.log('Error cleaning up recognition event handlers:', e);
      }
      
      // Clear the reference
      recognitionRef.current = null;
      
      // Update UI state
      setIsListening(false);
      setIsButtonActive(false);
      
      console.log(`Recognition cleanup complete (source: ${source})`);
    } else {
      console.log(`No active recognition to clean up (source: ${source})`);
    }
  };
  
  // Smart voice recognition with auto-stop and better silence detection
  const startImprovedVoiceRecognition = () => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOSSafari = isIOS && isSafari;
    
    console.log('Device detection:', { isIOS, isSafari, isIOSSafari });
    
    // For .app domains, assume it's iOS Safari for more aggressive pattern matching
    const isAppDomain = window.location.hostname.endsWith('.app');
    const forceIOSSafariHandling = isIOSSafari || isAppDomain;
    console.log('Enhanced detection:', { isAppDomain, forceIOSSafariHandling });
    
    // Set UI state
    setIsButtonActive(true);
    setIsListening(true);
    setVoiceSearchQuery('');
    
    // Use device-specific settings
    const useIOSMode = isIOSSafari;
    
    // Track state and results
    let finalResultReceived = false;
    let processingTimeout = null;
    let speechDetected = false;
    let lastActivity = Date.now();
    
    // Clean up any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      } catch (e) {
        console.log('Error cleaning up previous recognition:', e);
      }
    }
    
    // Create a new recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // Configure recognition settings
    recognition.lang = 'en-US';
    recognition.continuous = true; // Keep listening until extended silence
    
    // Configure device-specific settings
    if (useIOSMode) {
      // iOS Safari settings
      recognition.interimResults = true; // Get interim results
      recognition.maxAlternatives = 3;  // Get multiple alternatives for better accuracy
    } else {
      recognition.interimResults = true; // Also use interim results for other browsers for smoother experience
      recognition.maxAlternatives = 1;
    }
    
    console.log('Starting smarter voice recognition...');
    
    // Store transcript information
    let allTranscripts = [];
    let lastInterimResult = '';
    let lastFinalResult = '';
    let significantPauseDetected = false;
    
    // Set up silence detection with much shorter timeouts for immediate response
    let silenceTimer = null;
    const initialSilenceTimeout = useIOSMode ? 3000 : 2000; // Very short initial timeout
    const activeSilenceTimeout = 800; // Very short timeout after speech detected
    
    // Function to reset silence timer with dynamic timeouts
    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      
      // Use a longer timeout before any speech is detected,
      // and a shorter one once the user has started speaking
      const timeoutDuration = speechDetected ? activeSilenceTimeout : initialSilenceTimeout;
      
      silenceTimer = setTimeout(() => {
        // Check how long it's been since last activity
        const timeSinceActivity = Date.now() - lastActivity;
        
        // Respond immediately once we detect a pause
        if (timeSinceActivity > activeSilenceTimeout) {
          console.log(`Silence detected for ${timeSinceActivity}ms, stopping recognition`);
          significantPauseDetected = true;
          
          // Process results as soon as we have any content
          if (lastInterimResult.trim().length > 0 || lastFinalResult.trim().length > 0) {
            // Process the transcript immediately instead of waiting
            let bestTranscript = lastFinalResult || lastInterimResult;
            console.log('Processing transcript immediately:', bestTranscript);
            
            // Stop the recognition first
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
                console.log('Recognition stopped after significant pause');
              } catch (e) {
                console.log('Error stopping recognition on silence:', e);
              }
            }
          } else {
            // Reset timer but with shorter duration if nothing has been said
            lastActivity = Date.now();
            resetSilenceTimer();
          }
        }
      }, timeoutDuration);
    };
    
    // Set up speech event handlers
    recognition.onspeechstart = () => {
      console.log('Speech detected, tracking activity');
      speechDetected = true;
      lastActivity = Date.now();
      resetSilenceTimer();
    };
    
    recognition.onspeechend = () => {
      console.log('Speech ended');
      // Don't immediately stop, wait for silence timeout
    };
    
    recognition.onaudiostart = () => {
      console.log('Audio capturing started');
    };
    
    recognition.onaudioend = () => {
      console.log('Audio capturing ended');
    };
    
    recognition.onsoundstart = () => {
      console.log('Sound detected');
      lastActivity = Date.now();
    };
    
    recognition.onsoundend = () => {
      console.log('Sound ended');
    };
    
    recognition.onresult = (event) => {
      // Update last activity timestamp and reset silence detection
      lastActivity = Date.now();
      resetSilenceTimer();
      
      // Extract transcript
      let transcript = '';
      let isFinal = false;
      
      // Process results
      const results = event.results;
      for (let i = event.resultIndex; i < results.length; i++) {
        transcript = results[i][0].transcript;
        isFinal = results[i].isFinal;
        
        if (isFinal) {
          console.log('Final result:', transcript);
          finalResultReceived = true;
          lastFinalResult = transcript;
          allTranscripts.push({ text: transcript, isFinal: true });
          
          // Immediately process final results
          if (transcript.trim().length > 0) {
            console.log('Processing final result immediately');
            // Stop the recognition immediately
            try {
              recognition.stop();
            } catch (e) {
              console.log('Error stopping recognition on final result:', e);
            }
          }
          break;
        } else {
          lastInterimResult = transcript;
          console.log('Interim result:', transcript);
        }
      }
      
      // Decide which transcript to use
      let bestTranscript = lastFinalResult || lastInterimResult;
      
      // Update the UI
      if (bestTranscript.trim().length > 0) {
        setVoiceSearchQuery(bestTranscript);
        
        // Clear any existing timeout
        if (processingTimeout) {
          clearTimeout(processingTimeout);
        }
      }
    };
    
    recognition.onend = () => {
      console.log('Voice recognition ended');
      
      // Clear silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      
      // Reset UI state immediately
      setIsListening(false);
      setIsButtonActive(false);
      
      // Additional safety: ensure we're not still recording
      try {
        recognition.abort();
      } catch (e) {
        // Ignore errors here
      }
      
      // Get best available transcript and process immediately
      const bestTranscript = lastFinalResult || lastInterimResult;
      
      // Process results if we have a meaningful transcript - IMMEDIATELY
      if (bestTranscript.trim().length > 0) {
        // Pre-process the transcript
        let processedTranscript = bestTranscript;
        
        // Fix "Queen" vs "King" confusion
        const lowerTranscript = bestTranscript.toLowerCase();
        if (lowerTranscript.includes('king') || 
            lowerTranscript.includes('keen') || 
            lowerTranscript.includes('kin')) {
          if (!lowerTranscript.includes('queen') || 
              lowerTranscript.indexOf('king') < lowerTranscript.indexOf('queen')) {
            processedTranscript = bestTranscript.replace(/\b(king|keen|kin)\b/gi, 'King');
          }
        }
        
        console.log('Processing final transcript:', processedTranscript);
        processVoiceSearch(processedTranscript);
        finalResultReceived = true;
      }
      // If we didn't get any usable results
      else if (!finalResultReceived) {
        console.log('No speech detected');
        const emptyResults = {
          query: "No speech detected",
          foundMatch: false,
          noSpeechDetected: true,
          sessionId: `voice-search-${Date.now()}`,
          timestamp: Date.now()
        };
        setVoiceSearchResults(emptyResults);
        setShowVoiceSearchResults(true);
      }
      
      // Clean up recognition instance properly
      try {
        // First nullify all the handlers to prevent any callbacks
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onspeechstart = null;
          recognitionRef.current.onspeechend = null;
          recognitionRef.current.onaudiostart = null;
          recognitionRef.current.onaudioend = null;
          recognitionRef.current.onsoundstart = null;
          recognitionRef.current.onsoundend = null;
          recognitionRef.current.onspeechstart = null;
          
          // Then try to forcefully abort to make sure it's stopped
          recognitionRef.current.abort();
          recognitionRef.current = null;
        }
      } catch (e) {
        console.log('Error in final cleanup:', e);
      } finally {
        // Always ensure the button state is reset
        setIsButtonActive(false);
        setIsListening(false);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle errors without alerts
      if (event.error === 'not-allowed') {
        console.log('Microphone permission not granted');
      } else if (event.error === 'no-speech') {
        // This error often happens too quickly, so ignore it if we haven't had a chance
        if (Date.now() - lastActivity > 1000) { // Reduced from 2000ms to 1000ms
          console.log('No speech detected error');
        } else {
          console.log('Ignoring premature no-speech error');
          return; // Don't stop recognition yet
        }
      } else if (event.error === 'aborted') {
        console.log('Recognition aborted');
      }
      
      // Clear silence timer if it exists
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      
      // Reset UI state
      setIsListening(false);
      setIsButtonActive(false);
      
      // Log error silently without showing alerts
      console.log('Speech recognition failed to start - will try again automatically');
    };
    
    // Start recognition
    try {
      recognition.start();
      resetSilenceTimer();
      console.log('Voice recognition started with smart silence detection');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      stopVoiceRecognition(); // Use our unified stop method
      
      // Log error silently without showing alerts
      console.log('Speech recognition failed to start - will try again automatically');
    }
  };
  
  // Handle voice button press for a specific guided step
  const handleGuidedVoiceStep = (e) => {
    e.preventDefault();
    
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    setIsButtonActive(true);
    setIsListening(true);
    setVoiceSearchQuery('');
    
    // Clean up any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      } catch (e) {
        console.log('Error cleaning up previous recognition:', e);
      }
    }
    
    // Create a new recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // Configure recognition settings for better accuracy
    recognition.lang = 'en-US';
    recognition.continuous = false; // Changed to false to get complete utterances
    recognition.interimResults = false; // Changed to false to get only final results
    recognition.maxAlternatives = 3; // Get multiple alternatives
    
    // Get the current step
    const currentStep = guidedVoiceSearch.step;
    console.log(`Starting voice recognition for step ${currentStep}`);
    
    // Create a variable to store the transcript
    let transcript = '';
    
    recognition.onresult = (event) => {
      // Get the best result with highest confidence
      const result = event.results[0];
      transcript = result[0].transcript;
      
      // Log all alternatives for debugging
      for (let i = 0; i < result.length; i++) {
        console.log(`Alternative ${i}: ${result[i].transcript} (Confidence: ${result[i].confidence})`);
      }
      
      // Update the transcript in state
      setVoiceSearchQuery(transcript);
      console.log(`Final transcript for step ${currentStep}:`, transcript);
    };
    
    recognition.onend = () => {
      console.log(`Recognition ended for step ${currentStep}`);
      setIsListening(false);
      setIsButtonActive(false);
      
      // Make sure we have a valid transcript
      if (transcript && transcript.trim().length > 0) {
        // Process the result based on the current step
        processGuidedStepResult(transcript, currentStep);
      } else {
        // If no valid transcript, show an error or retry
        alert('No speech detected. Please try again.');
      }
    };
    
    // Handle errors
    recognition.onerror = (event) => {
      console.error(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setIsButtonActive(false);
      alert(`Speech recognition error: ${event.error}. Please try again.`);
    };
    
    // Start recognition
    try {
      recognition.start();
      console.log(`Recognition started for step ${currentStep}`);
    } catch (error) {
      console.error(`Error starting recognition for step ${currentStep}:`, error);
      setIsButtonActive(false);
      setIsListening(false);
    }
  };
  
  // Process the result of a guided voice step
  const processGuidedStepResult = (transcript, step) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Process based on the current step
    if (step === 1) { // Room type (smoking/non-smoking)
      let roomType = 'non-smoking'; // Default
      
      if (lowerTranscript.includes('smoking') && !lowerTranscript.includes('non') && 
          !lowerTranscript.includes('no smoking')) {
        roomType = 'smoking';
      }
      
      // Update state with the detected room type
      setGuidedVoiceSearch(prev => ({
        ...prev,
        roomType: roomType,
        exactQuery: lowerTranscript, // Store the exact query
        step: 2 // Move to next step
      }));
      
    } else if (step === 2) { // Bed type
      let bedType = 'Queen'; // Default
      
      if (lowerTranscript.includes('king')) {
        bedType = 'King';
      } else if (lowerTranscript.includes('double') || 
                lowerTranscript.includes('two bed') || 
                lowerTranscript.includes('2 bed')) {
        bedType = 'Queen2Beds';
      }
      
      // Update state with the detected bed type
      setGuidedVoiceSearch(prev => ({
        ...prev,
        bedType: bedType,
        exactQuery: prev.exactQuery + ' | ' + lowerTranscript, // Append the exact query
        step: 3 // Move to next step
      }));
      
    } else if (step === 3) { // Stay duration
      let stayDuration = 'tonight'; // Default
      let specificDate = null;
      
      // Advanced date detection for future stays
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Handle specific days of the week
      if (lowerTranscript.includes('saturday') || lowerTranscript.includes('saturday night')) {
        // Calculate days until next Saturday
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7; // If today is Saturday, get next Saturday
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilSaturday);
        stayDuration = `Saturday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      } 
      else if (lowerTranscript.includes('sunday') || lowerTranscript.includes('sunday night')) {
        const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilSunday);
        stayDuration = `Sunday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      else if (lowerTranscript.includes('monday') || lowerTranscript.includes('monday night')) {
        const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilMonday);
        stayDuration = `Monday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      else if (lowerTranscript.includes('tuesday') || lowerTranscript.includes('tuesday night')) {
        const daysUntilTuesday = (2 - dayOfWeek + 7) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilTuesday);
        stayDuration = `Tuesday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      else if (lowerTranscript.includes('wednesday') || lowerTranscript.includes('wednesday night')) {
        const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilWednesday);
        stayDuration = `Wednesday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      else if (lowerTranscript.includes('thursday') || lowerTranscript.includes('thursday night')) {
        const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilThursday);
        stayDuration = `Thursday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      else if (lowerTranscript.includes('friday') || lowerTranscript.includes('friday night')) {
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilFriday);
        stayDuration = `Friday (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      // Handle 'next week' or 'next [day]'
      else if (lowerTranscript.includes('next week')) {
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + 7);
        stayDuration = `Next week (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      else if (lowerTranscript.includes('next')) {
        // Handle 'next Saturday', 'next Sunday', etc.
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < days.length; i++) {
          if (lowerTranscript.includes(`next ${days[i]}`)) {
            const targetDay = i;
            // Calculate days until the next occurrence of the target day
            let daysUntil = (targetDay - dayOfWeek + 7) % 7;
            // If today is the target day or we've already passed it this week, add 7 days
            if (daysUntil === 0) daysUntil = 7;
            
            specificDate = new Date(today);
            specificDate.setDate(today.getDate() + daysUntil + 7); // Add 7 more days for 'next'
            stayDuration = `Next ${days[i].charAt(0).toUpperCase() + days[i].slice(1)} (${specificDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
            break;
          }
        }
      }
      // Handle 'weekend'
      else if (lowerTranscript.includes('weekend')) {
        // Calculate days until Friday
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
        specificDate = new Date(today);
        specificDate.setDate(today.getDate() + daysUntilFriday);
        stayDuration = 'weekend';
      }
      // Handle 'tonight' or default
      else {
        stayDuration = 'tonight';
      }
      
      // Update state with the detected stay duration
      setGuidedVoiceSearch(prev => ({
        ...prev,
        stayDuration: stayDuration,
        specificDate: specificDate,
        exactQuery: prev.exactQuery + ' | ' + lowerTranscript, // Append the exact query
        step: 4 // Move to results step
      }));
      
      // Process the complete guided search
      setTimeout(() => {
        processCompleteGuidedSearch();
      }, 500);
    }
  };
  
  // Process the complete guided search and show results
  const processCompleteGuidedSearch = () => {
    const { roomType, bedType, stayDuration, specificDate, exactQuery } = guidedVoiceSearch;
    
    // Build a query from the guided search parameters
    const query = `${bedType === 'Queen2Beds' ? 'double' : bedType} ${roomType} for ${stayDuration}`;
    console.log('Built query from guided search:', query);
    console.log('Original user queries:', exactQuery);
    
    // Set the detected query for display in the watermark
    setDetectedVoiceQuery({
      query: query,
      originalTranscript: exactQuery
    });
    
    // Handle specific dates for future stays
    if (specificDate) {
      const checkInDate = new Date(specificDate);
      const checkOutDate = new Date(specificDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1); // Default to 1 night stay
      
      // Format dates for the search
      const formattedCheckIn = checkInDate.toISOString().split('T')[0];
      const formattedCheckOut = checkOutDate.toISOString().split('T')[0];
      
      console.log(`Using specific dates: Check-in ${formattedCheckIn}, Check-out ${formattedCheckOut}`);
      
      // Process the search with specific dates
      processVoiceSearch(query, formattedCheckIn, formattedCheckOut);
    } else {
      // Process the query normally for tonight, weekend, etc.
      processVoiceSearch(query);
    }
    
    // Reset guided search state but keep the query for display
    setGuidedVoiceSearch(prev => ({
      ...prev,
      active: false
    }));
  };
  
  // Skip the current step in guided search
  const skipGuidedStep = () => {
    setGuidedVoiceSearch(prev => ({
      ...prev,
      step: prev.step < 3 ? prev.step + 1 : 4
    }));
    
    // If skipping the last step, process the complete search
    if (guidedVoiceSearch.step === 3) {
      setTimeout(() => {
        processCompleteGuidedSearch();
      }, 500);
    }
  };
  
  // Close the guided voice search
  const closeGuidedVoiceSearch = () => {
    setGuidedVoiceSearch({
      active: false,
      step: 1,
      roomType: null,
      bedType: null,
      stayDuration: null
    });
  };
  
  // Handle voice button press (improved with auto-stop)
  const handleVoiceButtonPress = (e) => {
    e.preventDefault(); // Prevent default behavior
    
    // If already listening, don't do anything (single tap to start only)
    if (isListening) return;
    
    // Generate a unique ID for this voice search attempt
    const searchSessionId = `voice-search-${Date.now()}`;
    console.log(`Starting new voice search session: ${searchSessionId}`);
    
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    // Update UI state
    setIsButtonActive(true);
    setIsListening(true);
    
    // IMPORTANT: Reset all state variables to ensure a fresh start
    setVoiceSearchQuery('');
    setShowVoiceSearchResults(false);
    setVoiceSearchResults(null);
    
    // Clean up any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      } catch (e) {
        console.log('Error cleaning up previous recognition:', e);
      }
    }
    
    // Create a fresh recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure recognition settings
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set up silence detection
    let silenceTimer = null;
    let lastActivity = Date.now();
    let lastInterimResult = '';
    let lastFinalResult = '';
    let significantPauseDetected = false;
    let speechDetected = false;
    let sessionTranscript = '';
    
    // Function to reset silence timer
    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      const timeoutDuration = speechDetected ? 800 : 1500;
      
      silenceTimer = setTimeout(() => {
        const timeSinceActivity = Date.now() - lastActivity;
        if (timeSinceActivity > timeoutDuration) {
          console.log(`Silence timeout reached after ${timeSinceActivity}ms`);
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
              console.log('Recognition stopped due to silence timeout');
            } catch (e) {
              console.error('Error stopping recognition on silence timeout:', e);
            }
          }
        } else {
          // Still check frequently if we've had enough silence
          const checkInterval = 300; // Check every 300ms
          silenceTimer = setTimeout(() => {
            const newTimeSinceActivity = Date.now() - lastActivity;
            if (newTimeSinceActivity > timeoutDuration) {
              console.log(`Silence detected in interval check after ${newTimeSinceActivity}ms`);
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                  console.log('Recognition stopped after significant pause');
                } catch (e) {
                  console.error('Error stopping recognition in interval check:', e);
                }
              }
            }
          }, checkInterval);
        }
      }, Math.min(timeoutDuration/2, 750)); // Check halfway through or after 750ms max
    };
    
    recognition.onstart = () => {
      console.log(`Recognition started for session ${searchSessionId}`);
      // Start silence detection
      resetSilenceTimer();
    };
  
    recognition.onspeechstart = () => {
      console.log('Speech started, resetting silence timer');
      resetSilenceTimer();
    };
  
    recognition.onspeechend = () => {
      console.log('Speech ended, processing results soon');
      
      // Process results almost immediately after speech ends
      // Only wait a very short time for final results to come in
      setTimeout(() => {
        // Only process if recognition is still active (wasn't already processed by silence timer)
        if (recognitionRef.current) {
          console.log('Processing results immediately after speech end');
          try {
            recognitionRef.current.stop(); // This will trigger onend and process results
          } catch (e) {
            console.error('Error stopping recognition after speech end:', e);
            // Force process results anyway
            const finalTranscript = sessionTranscript || voiceSearchQuery;
            if (finalTranscript && finalTranscript.trim().length > 0) {
              processVoiceSearch(finalTranscript.trim(), searchSessionId);
            }
            // Force UI update
            setIsListening(false);
            setIsButtonActive(false);
          }
        }
      }, 500); // Shorter delay to ensure faster response
    };
  
    recognition.onresult = (event) => {
      // Reset silence timer when we get results
      resetSilenceTimer();
      
      // Reset the transcript for this event
      let currentTranscript = '';
      
      // Process all results
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      
      // Update the session transcript
      sessionTranscript = currentTranscript;
      
      // Update the state with the current transcript
      setVoiceSearchQuery(currentTranscript);
      console.log(`Transcript for session ${searchSessionId}:`, currentTranscript);
    };
    
    recognition.onerror = (event) => {
      console.error(`Recognition error in session ${searchSessionId}:`, event.error);
    };
    
    recognition.onend = () => {
      console.log(`Recognition ended for session ${searchSessionId}`);
      
      // Clear silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      
      // Get the final transcript before cleaning up
      const finalTranscript = sessionTranscript || voiceSearchQuery;
      
      // Clean up the recognition instance
      if (recognitionRef.current) {
        try {
          // Clear all event handlers
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onspeechend = null;
          recognitionRef.current.onnomatch = null;
          recognitionRef.current.onaudiostart = null;
          recognitionRef.current.onaudioend = null;
          recognitionRef.current.onsoundstart = null;
          recognitionRef.current.onsoundend = null;
          recognitionRef.current.onspeechstart = null;
          
          // Clear the reference
          recognitionRef.current = null;
        } catch (e) {
          console.error('Error during recognition cleanup in onend:', e);
        }
      }
      
      // Update UI state
      setIsListening(false);
      setIsButtonActive(false);
      
      // Process the voice search if we have a transcript
      if (finalTranscript && finalTranscript.trim().length > 0) {
        console.log(`Auto-processing query from onend: ${finalTranscript.trim()}`);
        processVoiceSearch(finalTranscript.trim(), searchSessionId);
      } else {
        console.log('No speech detected in onend handler');
        const emptyResults = {
          query: "No speech detected",
          foundMatch: false,
          noSpeechDetected: true,
          sessionId: searchSessionId,
          timestamp: Date.now()
        };
        setVoiceSearchResults(emptyResults);
        setShowVoiceSearchResults(true);
      }
    };
    
    // Add absolute maximum timeout to guarantee voice recognition always stops
    const maxRecognitionTimeout = setTimeout(() => {
      console.log('Maximum recognition time reached, forcing stop');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping recognition at max timeout:', e);
          // Force process any results we have
          const finalTranscript = sessionTranscript || voiceSearchQuery;
          if (finalTranscript && finalTranscript.trim().length > 0) {
            processVoiceSearch(finalTranscript.trim(), searchSessionId);
          } else {
            // No speech detected, show error
            const emptyResults = {
              query: "No speech detected",
              foundMatch: false,
              noSpeechDetected: true,
              sessionId: searchSessionId,
              timestamp: Date.now()
            };
            setVoiceSearchResults(emptyResults);
            setShowVoiceSearchResults(true);
          }
          // Force UI update
          setIsListening(false);
          setIsButtonActive(false);
        }
      }
    }, 4000); // Hard limit of 4 seconds max for voice recognition
    
    // Start recognition
    try {
      recognition.start();
      console.log(`Recognition successfully started for session ${searchSessionId}`);
    } catch (error) {
      console.error(`Error starting recognition for session ${searchSessionId}:`, error);
      clearTimeout(maxRecognitionTimeout);
      setIsListening(false);
      setIsButtonActive(false);
    }
    
    // Add cleanup for the max timeout when recognition ends
    const originalOnEnd = recognition.onend;
    recognition.onend = (event) => {
      // Clear the max timeout
      clearTimeout(maxRecognitionTimeout);
      // Call the original handler
      if (originalOnEnd) originalOnEnd(event);
    };
  };
  
  // Manual stop recognition function (for emergency use)
  const stopRecognition = () => {
    if (!recognitionRef.current) return;
    
    console.log('Manually stopping recognition');
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('Error manually stopping recognition:', e);
    }
    
    // Update UI state immediately
    setIsListening(false);
    setIsButtonActive(false);
  };
  // Handle mouse events for desktop browsers
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleVoiceButtonPress(e);
  };
  
  // Process voice search query with complete state isolation
  const processVoiceSearch = (query, specificCheckIn = null, specificCheckOut = null, searchId = null) => {
    // Force a complete reset of any previous state
    // This is a drastic measure but necessary to prevent result caching
    const forceReset = () => {
      console.log('Forcing complete state reset before processing new query');
      setVoiceSearchResults(null);
      setShowVoiceSearchResults(false);
      setVoiceSearchError(null);
      setVoiceSearchQuery('');
    };
    
    forceReset();
    
    // Ensure any active recognition is stopped
    if (recognitionRef.current) {
      console.log('Stopping any active recognition before processing new query');
      stopAndCleanupRecognition(searchId || 'process-voice-search');
    }
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Process the query
    setTimeout(() => {
      // Process the query first
      processVoiceSearchInternal(query, specificCheckIn, specificCheckOut, searchId);
      
      // Show the results
      setShowVoiceSearchResults(true);
      
      // Ensure microphone is definitely stopped when showing results
      if (recognitionRef.current) {
        console.log('Ensuring recognition is stopped after processing');
        stopAndCleanupRecognition(searchId || 'show-results');
      }
      
      // For iOS devices, we need to do some extra work to make the modal visible
      if (isIOS) {
        // Force iOS to recognize the modal
        setTimeout(() => {
          // Get the modal element
          const modal = document.getElementById('voiceSearchResults');
          if (modal) {
            // Force iOS to redraw the modal
            modal.style.display = 'none';
            setTimeout(() => {
              modal.style.display = 'flex';
              // Scroll to top to ensure visibility
              window.scrollTo(0, 0);
              document.body.style.overflow = 'hidden';
            }, 10);
          }
        }, 100);
      }
    }, 100);
  };
  
  // Helper function to check if days are consecutive
  const areConsecutiveDays = (sortedDays) => {
    // If all days are in different weeks, they can't be consecutive
    const allSameWeek = sortedDays.every(day => day.isNextWeek === sortedDays[0].isNextWeek);
    if (!allSameWeek) return false;
    
    // If we have 2 or fewer days, check if they are adjacent
    if (sortedDays.length <= 2) {
      return sortedDays[sortedDays.length - 1].index === (sortedDays[0].index + sortedDays.length - 1) % 7;
    }
    
    // For 3+ days, check every pair of days to ensure they're all consecutive
    for (let i = 1; i < sortedDays.length; i++) {
      // Check if this day's index is exactly 1 more than the previous day's index
      if (sortedDays[i].index !== (sortedDays[i-1].index + 1) % 7) {
        return false;
      }
    }
    return true;
  };
  
  // Helper function to strictly check if we're dealing with a non-consecutive days query
  const isNonConsecutiveDaysQuery = (query, sortedDays) => {
    // If the query explicitly contains "and" between days
    const hasAndKeyword = query.toLowerCase().includes(' and ');
    
    // If there are commas between days, that's also a strong indicator
    const hasDayCommas = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*,\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(query);
    
    // Check for explicit phrases like "only Monday, Tuesday and Friday"
    const hasOnlyKeyword = /\bonly\b.*\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(query);
    
    // If days aren't consecutive
    const daysNotConsecutive = !areConsecutiveDays(sortedDays);
    
    // If we have 3+ days with "and" or commas, or if days aren't consecutive, treat as non-consecutive
    return (hasAndKeyword || hasDayCommas || hasOnlyKeyword || 
           (sortedDays.length >= 3 && daysNotConsecutive));
  };
  
  // Internal implementation of voice search processing with complete isolation
  const processVoiceSearchInternal = (query, specificCheckIn = null, specificCheckOut = null, searchId = null) => {
    if (!query || query.trim().length < 3) return;
    
    // Function to check if query contains overnight stay keywords
    const containsOvernightKeywords = (query) => {
      const overnightKeywords = [
        'night', 'tonight', 'tomorrow', 'next day', 'overnight',
        'monday night', 'tuesday night', 'wednesday night', 'thursday night',
        'friday night', 'saturday night', 'sunday night',
        'for tonight', 'for tomorrow', 'for next', 'next week', 'next month',
        'check out tomorrow', 'check-out tomorrow', 'for tuesday', 'for wednesday',
        'for thursday', 'for friday', 'for saturday', 'for sunday', 'for monday'
      ];
      
      return overnightKeywords.some(keyword => query.includes(keyword));
    };
    
    // Check for short stay queries first
    const queryLower = query.toLowerCase();
    
    // Check if query is likely for an overnight stay
    const isLikelyOvernightStay = containsOvernightKeywords(queryLower);
    console.log(`Checking if query is for overnight stay: ${isLikelyOvernightStay}`);
    
    // If the query contains overnight keywords, skip short stay processing
    if (isLikelyOvernightStay) {
      console.log('Query contains overnight stay keywords, not processing as short stay');
      // Continue with regular voice search processing (will fall through to overnight processing)
    } else {
    
    // First, try to match the full pattern with explicit AM/PM
    // Handle various formats including "5.AM", "5 AM", "5:00 AM", etc.
    // Also handle "I want" and "I need" phrases
    // Include patterns for just "room till X" without explicit "short stay"
    const amPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:till|until|to)\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*|\.)(?:am|a\.m\.|a)\b/i;
    const pmPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:till|until|to)\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*|\.)?(?:pm|p\.m\.|p)\b/i;
    
    // Then fall back to the generic pattern without explicit AM/PM
    const genericPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:till|until|to)\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*(?:hrs|hours|hr|hour|o'clock))?\b/i;
    
    // Additional patterns for jacuzzi short stays
    const amJacuzziPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:with\s+jacuzzi|jacuzzi)\s+(?:till|until|to)\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*|\.)?(?:am|a\.m\.|a)\b/i;
    const pmJacuzziPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:with\s+jacuzzi|jacuzzi)\s+(?:till|until|to)\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*|\.)?(?:pm|p\.m\.|p)\b/i;
    const genericJacuzziPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:with\s+jacuzzi|jacuzzi)\s+(?:till|until|to)\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*(?:hrs|hours|hr|hour|o'clock))?\b/i;
    
    // Pattern for short stay with jacuzzi but no specific time (default to 3 PM)
    const jacuzziNoTimePattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay|(?:room|king|queen|bed)(?:\s+\w+){0,3})\s+(?:with\s+jacuzzi|jacuzzi)\b/i;
    
    // Pattern for just 'short stay' with no specific time (default to 4 hours)
    const justShortStayPattern = /\b(?:short\s+stay|i\s+(?:want|need)\s+(?:a\s+)?short\s+stay)\b/i;
    
    // Patterns for specific hour durations - more flexible patterns for iOS Safari compatibility
    const standaloneHoursPattern = /(\d{1,2})\s*(?:hrs|hours|hr|hour)/i; // Removed word boundary for iOS Safari
    const specificHoursPattern = /(\d{1,2})\s*(?:hrs|hours|hr|hour)/i; // Removed word boundary for iOS Safari
    const specificHoursJacuzziPattern = /(\d{1,2})\s*(?:hrs|hours|hr|hour)(?:\s+|\s*)(?:with\s+jacuzzi|jacuzzi|with\s+jets|jets)/i; // More flexible spacing
    const jacuzziSpecificHoursPattern = /(?:with\s+jacuzzi|jacuzzi|with\s+jets|jets)(?:\s+|\s*)(\d{1,2})\s*(?:hrs|hours|hr|hour)/i; // More flexible spacing
    
    // New patterns for "room for X hours" format
    const roomForHoursPattern = /(?:room|king|queen|bed)\s+(?:for|of)\s+(\d{1,2})\s*(?:hrs|hours|hr|hour)/i; // "room for 9 hours"
    const roomForHoursJacuzziPattern = /(?:room|king|queen|bed)\s+(?:with\s+jacuzzi|jacuzzi)\s+(?:for|of)\s+(\d{1,2})\s*(?:hrs|hours|hr|hour)/i; // "room with jacuzzi for 9 hours"
    const roomForHoursJacuzziPattern2 = /(?:room|king|queen|bed)\s+(?:for|of)\s+(\d{1,2})\s*(?:hrs|hours|hr|hour)\s+(?:with\s+jacuzzi|jacuzzi)/i; // "room for 9 hours with jacuzzi"
    
    // Ultra simple patterns for iOS Safari - these will catch the most basic queries
    const ultraSimpleHoursPattern = /^\s*(\d{1,2})\s*(?:hr|hrs|hour|hours|h)\s*$/i; // Just "8 hrs" or "8 h"
    const ultraSimpleHoursJacuzziPattern = /^\s*(\d{1,2})\s*(?:hr|hrs|hour|hours|h)\s*(?:jacuzzi|jets|spa|hot\s*tub)\s*$/i; // Just "8 hrs jacuzzi"
    
    // Additional iOS Safari specific patterns to catch more hour variations
    const iosSafariHoursPattern = /\b(\d{1,2})\s*(?:hr|hrs|hour|hours|h)\b/i; // Catch "8 hours" anywhere in the query
    const iosSafariNumericPattern = /\b(?:(?:for|of)\s+)?(\d{1,2})\b/i; // Numbers with or without "for" prefix
    
    // Extreme fallback patterns for Safari on .app domains
    const extremeFallbackHoursPattern = /^\s*(\d{1,2})\s*$/i; // Just the number itself, like "8"
    const fallbackHoursWithJacuzziPattern = /^\s*(\d{1,2})\s+(?:jacuzzi|jets|spa|hot\s*tub)\s*$/i; // "8 jacuzzi"
    const fallbackJacuzziWithHoursPattern = /^\s*(?:jacuzzi|jets|spa|hot\s*tub)\s+(\d{1,2})\s*$/i; // "jacuzzi 8"
    
    // Additional patterns for just time mentions that imply short stay
    const justTimeAmPattern = /\b(?:till|until|to)\s+(\d{1,2})(?:[:.][0-9]{2})?(?:\s*|\.)?(?:am|a\.m\.|a)\b/i;
    const justTimePmPattern = /\b(?:till|until|to)\s+(\d{1,2})(?:[:.][0-9]{2})?(?:\s*|\.)?(?:pm|p\.m\.|p)\b/i;
    const justTimeGenericPattern = /\b(?:till|until|to)\s+(\d{1,2})(?:[:.][0-9]{2})?(?:\s*(?:hrs|hours|hr|hour|o'clock))?\b/i;
    
    // First check for Jacuzzi patterns with explicit AM/PM
    const amJacuzziMatch = queryLower.match(amJacuzziPattern);
    if (amJacuzziMatch && amJacuzziMatch[1]) {
      console.log('Short stay with Jacuzzi and EXPLICIT AM detected');
      console.log('AM Jacuzzi Match:', amJacuzziMatch);
      console.log('Hour:', parseInt(amJacuzziMatch[1], 10));
      // Extract minutes if available (amJacuzziMatch[2])
      const minutes = amJacuzziMatch[2] ? parseInt(amJacuzziMatch[2], 10) : 0;
      console.log('Minutes:', minutes);
      processShortStayVoiceSearch(query, parseInt(amJacuzziMatch[1], 10), searchId, true, false, true, minutes);
      return;
    }
    
    const pmJacuzziMatch = queryLower.match(pmJacuzziPattern);
    if (pmJacuzziMatch && pmJacuzziMatch[1]) {
      console.log('Short stay with Jacuzzi and EXPLICIT PM detected');
      console.log('PM Jacuzzi Match:', pmJacuzziMatch);
      console.log('Hour:', parseInt(pmJacuzziMatch[1], 10));
      // Extract minutes if available (pmJacuzziMatch[2])
      const minutes = pmJacuzziMatch[2] ? parseInt(pmJacuzziMatch[2], 10) : 0;
      console.log('Minutes:', minutes);
      processShortStayVoiceSearch(query, parseInt(pmJacuzziMatch[1], 10), searchId, false, true, true, minutes);
      return;
    }
    
    const genericJacuzziMatch = queryLower.match(genericJacuzziPattern);
    if (genericJacuzziMatch && genericJacuzziMatch[1]) {
      console.log('Short stay with Jacuzzi and NO explicit AM/PM detected');
      console.log('Generic Jacuzzi Match:', genericJacuzziMatch);
      console.log('Hour:', parseInt(genericJacuzziMatch[1], 10));
      // Extract minutes if available (genericJacuzziMatch[2])
      const minutes = genericJacuzziMatch[2] ? parseInt(genericJacuzziMatch[2], 10) : 0;
      console.log('Minutes:', minutes);
      processShortStayVoiceSearch(query, parseInt(genericJacuzziMatch[1], 10), searchId, false, false, true, minutes);
      return;
    }
    
    // Then check for standard AM pattern
    // Check for specific hours with jacuzzi patterns first (e.g., "8 hrs with jacuzzi", "jacuzzi 6 hours")
    // Also add a special debug log for iOS Safari
    console.log('Raw iOS Safari query:', queryLower);
    const hoursWithJacuzziMatch = queryLower.match(specificHoursJacuzziPattern);
    if (hoursWithJacuzziMatch && hoursWithJacuzziMatch[1]) {
      console.log('Short stay with SPECIFIC HOURS and JACUZZI detected');
      console.log('Hours Jacuzzi Match:', hoursWithJacuzziMatch);
      const hours = parseInt(hoursWithJacuzziMatch[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a short stay with the calculated end time and jacuzzi
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
      return;
    }
    
    // Check alternative pattern "jacuzzi 6 hours"
    const jacuzziWithHoursMatch = queryLower.match(jacuzziSpecificHoursPattern);
    if (jacuzziWithHoursMatch && jacuzziWithHoursMatch[1]) {
      console.log('Short stay with JACUZZI and SPECIFIC HOURS detected');
      console.log('Jacuzzi Hours Match:', jacuzziWithHoursMatch);
      const hours = parseInt(jacuzziWithHoursMatch[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a short stay with the calculated end time and jacuzzi
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
      return;
    }
    
    // Check for standalone hours pattern (e.g., "6 hours", "for 8 hrs")
    // Add iOS Safari specific debug logging
    console.log('iOS Safari debug - Raw query for hours detection:', queryLower);
    console.log('iOS Safari debug - Looking for pattern:', standaloneHoursPattern);
    
    // Special check for ultra-simple patterns for iOS Safari
    const ultraSimpleHoursMatchResult = queryLower.match(ultraSimpleHoursPattern);
    const ultraSimpleJacuzziMatchResult = queryLower.match(ultraSimpleHoursJacuzziPattern);
    
    console.log('iOS Safari debug - Ultra simple hours match:', ultraSimpleHoursMatchResult);
    console.log('iOS Safari debug - Ultra simple hours with jacuzzi match:', ultraSimpleJacuzziMatchResult);
    
    // Check the ultra-simple jacuzzi pattern first (e.g., "8 hrs jacuzzi")
    if (ultraSimpleJacuzziMatchResult && ultraSimpleJacuzziMatchResult[1]) {
      console.log('iOS Safari - Ultra simple HOURS WITH JACUZZI detected');
      const hours = parseInt(ultraSimpleJacuzziMatchResult[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a short stay with jacuzzi
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
      return;
    }
    
    // Check the ultra-simple hours pattern (e.g., "8 hrs")
    if (ultraSimpleHoursMatchResult && ultraSimpleHoursMatchResult[1]) {
      console.log('iOS Safari - Ultra simple HOURS detected');
      const hours = parseInt(ultraSimpleHoursMatchResult[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a regular short stay
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
      return;
    }
    
    // Check for "room for X hours" patterns
    const roomForHoursMatchResult = queryLower.match(roomForHoursPattern);
    if (roomForHoursMatchResult && roomForHoursMatchResult[1]) {
      console.log('Room for specific hours detected');
      const hours = parseInt(roomForHoursMatchResult[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a regular short stay with the specified duration
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
      return;
    }
    
    // Check for "room with jacuzzi for X hours" pattern
    const roomForHoursJacuzziMatchResult = queryLower.match(roomForHoursJacuzziPattern);
    if (roomForHoursJacuzziMatchResult && roomForHoursJacuzziMatchResult[1]) {
      console.log('Room with jacuzzi for specific hours detected');
      const hours = parseInt(roomForHoursJacuzziMatchResult[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a short stay with jacuzzi with the specified duration
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
      return;
    }
    
    // Check for "room for X hours with jacuzzi" pattern
    const roomForHoursJacuzziMatchResult2 = queryLower.match(roomForHoursJacuzziPattern2);
    if (roomForHoursJacuzziMatchResult2 && roomForHoursJacuzziMatchResult2[1]) {
      console.log('Room for specific hours with jacuzzi detected');
      const hours = parseInt(roomForHoursJacuzziMatchResult2[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a short stay with jacuzzi with the specified duration
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
      return;
    }
    
    // Check for extreme fallback patterns specifically for iOS Safari and .app domains
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOSSafari = isIOS && isSafari;
    const isAppDomain = window.location.hostname.endsWith('.app');
    const forceIOSSafariHandling = isIOSSafari || isAppDomain;
    
    console.log('Device and domain detection:', { isIOS, isSafari, isIOSSafari, isAppDomain, forceIOSSafariHandling });
    
    // Apply extreme fallback patterns for iOS Safari and .app domains
    if (forceIOSSafariHandling) {
      // Check for "8 jacuzzi" pattern
      const fallbackHoursWithJacuzziMatchResult = queryLower.match(fallbackHoursWithJacuzziPattern);
      if (fallbackHoursWithJacuzziMatchResult && fallbackHoursWithJacuzziMatchResult[1]) {
        console.log('iOS Safari - Extreme fallback HOURS WITH JACUZZI detected');
        const hours = parseInt(fallbackHoursWithJacuzziMatchResult[1], 10);
        console.log('Hours:', hours);
        
        // Calculate target hour based on current time + requested hours
        const currentTime = new Date();
        const targetHour = (currentTime.getHours() + hours) % 24;
        const currentMinutes = currentTime.getMinutes();
        
        // Process as a short stay with jacuzzi
        processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
        return;
      }
      
      // Check for "jacuzzi 8" pattern
      const fallbackJacuzziWithHoursMatchResult = queryLower.match(fallbackJacuzziWithHoursPattern);
      if (fallbackJacuzziWithHoursMatchResult && fallbackJacuzziWithHoursMatchResult[1]) {
        console.log('iOS Safari - Extreme fallback JACUZZI WITH HOURS detected');
        const hours = parseInt(fallbackJacuzziWithHoursMatchResult[1], 10);
        console.log('Hours:', hours);
        
        // Calculate target hour based on current time + requested hours
        const currentTime = new Date();
        const targetHour = (currentTime.getHours() + hours) % 24;
        const currentMinutes = currentTime.getMinutes();
        
        // Process as a short stay with jacuzzi
        processShortStayVoiceSearch(query, targetHour, searchId, false, false, true, currentMinutes, true, hours);
        return;
      }
      
      // Check for just the number ("8")
      const extremeFallbackHoursMatchResult = queryLower.match(extremeFallbackHoursPattern);
      if (extremeFallbackHoursMatchResult && extremeFallbackHoursMatchResult[1]) {
        console.log('iOS Safari - Extreme fallback JUST HOURS detected');
        const hours = parseInt(extremeFallbackHoursMatchResult[1], 10);
        console.log('Hours:', hours);
        
        // Calculate target hour based on current time + requested hours
        const currentTime = new Date();
        const targetHour = (currentTime.getHours() + hours) % 24;
        const currentMinutes = currentTime.getMinutes();
        
        // Process as a regular short stay
        processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
        return;
      }
    }
    
    // Enhanced iOS Safari specific patterns for better hour detection
    if (isIOS || forceIOSSafariHandling) {
      // Try the more flexible iOS Safari hours pattern
      const iosSafariHoursMatchResult = queryLower.match(iosSafariHoursPattern);
      if (iosSafariHoursMatchResult && iosSafariHoursMatchResult[1]) {
        console.log('iOS Safari - Enhanced hours pattern detected');
        const hours = parseInt(iosSafariHoursMatchResult[1], 10);
        console.log('Hours:', hours);
        
        // Calculate target hour based on current time + requested hours
        const currentTime = new Date();
        const targetHour = (currentTime.getHours() + hours) % 24;
        const currentMinutes = currentTime.getMinutes();
        
        // Process as a regular short stay with the explicit duration
        processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
        return;
      }
      
      // Try the numeric pattern which catches isolated numbers like "for 5"
      const iosSafariNumericMatchResult = queryLower.match(iosSafariNumericPattern);
      if (iosSafariNumericMatchResult && iosSafariNumericMatchResult[1] && 
          // Only process this if there's also a context clue indicating it's about room or stay
          /\b(?:room|stay|book|night|king|queen|bed)\b/i.test(queryLower)) {
        console.log('iOS Safari - Enhanced numeric with room context pattern detected');
        const hours = parseInt(iosSafariNumericMatchResult[1], 10);
        console.log('Hours:', hours);
        
        // Calculate target hour based on current time + requested hours
        const currentTime = new Date();
        const targetHour = (currentTime.getHours() + hours) % 24;
        const currentMinutes = currentTime.getMinutes();
        
        // Process as a regular short stay with the explicit duration
        processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
        return;
      }
    }
    
    // Check if this is a very simple query that might be just hours (standard fallback)
    const simpleHourCheck = /^\s*(\d{1,2})\s*(?:hr|hrs|hour|hours)\s*$/i.test(queryLower);
    const extractedHours = queryLower.match(/(\d{1,2})\s*(?:hr|hrs|hour|hours)/i);
    
    console.log('iOS Safari debug - Simple hour check:', simpleHourCheck);
    console.log('iOS Safari debug - Extracted hours:', extractedHours);
    
    // Use the standard pattern 
    const standaloneHoursMatch = queryLower.match(standaloneHoursPattern);
    
    // For iOS Safari, also do a manual check if the pattern doesn't match
    if ((standaloneHoursMatch && standaloneHoursMatch[1]) || (simpleHourCheck && extractedHours && extractedHours[1])) {
      // Use either the pattern match or the extracted hours
      const hoursStr = standaloneHoursMatch && standaloneHoursMatch[1] ? standaloneHoursMatch[1] : extractedHours[1];
      const hours = parseInt(hoursStr, 10);
      console.log('Short stay with STANDALONE HOURS detected');
      console.log('Standalone Hours Match:', standaloneHoursMatch || extractedHours);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a regular short stay with the calculated end time
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
      return;
    }
    
    // Check for general hours pattern within context (e.g., "king room 6 hrs")
    const generalHoursMatch = queryLower.match(specificHoursPattern);
    if (generalHoursMatch && generalHoursMatch[1]) {
      console.log('Short stay with SPECIFIC HOURS detected');
      console.log('Hours Match:', generalHoursMatch);
      const hours = parseInt(generalHoursMatch[1], 10);
      console.log('Hours:', hours);
      
      // Calculate target hour based on current time + requested hours
      const currentTime = new Date();
      const targetHour = (currentTime.getHours() + hours) % 24;
      const currentMinutes = currentTime.getMinutes();
      
      // Process as a regular short stay with the calculated end time
      processShortStayVoiceSearch(query, targetHour, searchId, false, false, false, currentMinutes, true, hours);
      return;
    }
    
    const amMatch = queryLower.match(amPattern);
    if (amMatch && amMatch[1]) {
      console.log('Short stay with EXPLICIT AM detected');
      console.log('AM Match:', amMatch);
      console.log('Hour:', parseInt(amMatch[1], 10));
      // Extract minutes if available (amMatch[2])
      const minutes = amMatch[2] ? parseInt(amMatch[2], 10) : 0;
      console.log('Minutes:', minutes);
      processShortStayVoiceSearch(query, parseInt(amMatch[1], 10), searchId, true, false, false, minutes);
      return;
    }
    
    // Then check for PM pattern
    const pmMatch = queryLower.match(pmPattern);
    if (pmMatch && pmMatch[1]) {
      console.log('Short stay with EXPLICIT PM detected');
      console.log('PM Match:', pmMatch);
      console.log('Hour:', parseInt(pmMatch[1], 10));
      // Extract minutes if available (pmMatch[2])
      const minutes = pmMatch[2] ? parseInt(pmMatch[2], 10) : 0;
      console.log('Minutes:', minutes);
      processShortStayVoiceSearch(query, parseInt(pmMatch[1], 10), searchId, false, true, false, minutes);
      return;
    }
    
    // Finally, fall back to generic pattern
    const genericMatch = queryLower.match(genericPattern);
    if (genericMatch && genericMatch[1]) {
      console.log('Short stay with NO explicit AM/PM detected');
      console.log('Generic Match:', genericMatch);
      console.log('Hour:', parseInt(genericMatch[1], 10));
      // Extract minutes if available (genericMatch[2])
      const minutes = genericMatch[2] ? parseInt(genericMatch[2], 10) : 0;
      console.log('Minutes:', minutes);
      processShortStayVoiceSearch(query, parseInt(genericMatch[1], 10), searchId, false, false, false, minutes);
      return;
    }
    
    // Check for short stay with jacuzzi but no specific time (default to 3 PM)
    const jacuzziNoTimeMatch = queryLower.match(jacuzziNoTimePattern);
    if (jacuzziNoTimeMatch) {
      console.log('Short stay with Jacuzzi but NO time specified - defaulting to 3 PM');
      console.log('Jacuzzi No Time Match:', jacuzziNoTimeMatch);
      // Default to 3 PM (15:00) for checkout time
      processShortStayVoiceSearch(query, 15, searchId, false, true, true);
      return;
    }
    
    // Check for just 'short stay' with no specific time (default to 4 hours)
    const justShortStayMatch = queryLower.match(justShortStayPattern);
    if (justShortStayMatch) {
      console.log('Just "short stay" detected - calculating for default 4 hours');
      console.log('Short Stay Match:', justShortStayMatch);
      
      // Get current time
      const currentTime = new Date();
      // Calculate checkout time (current time + 4 hours)
      const checkoutHour = (currentTime.getHours() + 4) % 24;
      
      // Use processShortStayVoiceSearch with the calculated checkout hour
      const isPM = checkoutHour >= 12;
      processShortStayVoiceSearch(query, isPM ? (checkoutHour === 12 ? 12 : checkoutHour % 12) : checkoutHour, searchId, !isPM, isPM, false);
      return;
    }
    
    // Check for specific hour durations with jacuzzi (e.g., "6 hours with jacuzzi")
    const specificHoursJacuzziMatch = queryLower.match(specificHoursJacuzziPattern);
    if (specificHoursJacuzziMatch && specificHoursJacuzziMatch[1]) {
      const hours = parseInt(specificHoursJacuzziMatch[1], 10);
      console.log(`Specific hours with jacuzzi detected: ${hours} hours`);
      
      // Get current time
      const currentTime = new Date();
      // Calculate checkout time (current time + specified hours)
      const checkoutHour = (currentTime.getHours() + hours) % 24;
      
      // Use processShortStayVoiceSearch with the calculated checkout hour
      const isPM = checkoutHour >= 12;
      processShortStayVoiceSearch(query, isPM ? (checkoutHour === 12 ? 12 : checkoutHour % 12) : checkoutHour, searchId, !isPM, isPM, true);
      return;
    }
    
    // Check for jacuzzi with specific hour durations (e.g., "jacuzzi for 6 hours")
    const jacuzziSpecificHoursMatch = queryLower.match(jacuzziSpecificHoursPattern);
    if (jacuzziSpecificHoursMatch && jacuzziSpecificHoursMatch[1]) {
      const hours = parseInt(jacuzziSpecificHoursMatch[1], 10);
      console.log(`Jacuzzi with specific hours detected: ${hours} hours`);
      
      // Get current time
      const currentTime = new Date();
      // Calculate checkout time (current time + specified hours)
      const checkoutHour = (currentTime.getHours() + hours) % 24;
      
      // Use processShortStayVoiceSearch with the calculated checkout hour
      const isPM = checkoutHour >= 12;
      processShortStayVoiceSearch(query, isPM ? (checkoutHour === 12 ? 12 : checkoutHour % 12) : checkoutHour, searchId, !isPM, isPM, true);
      return;
    }
    
    // First check for standalone hour mentions (e.g., just "9 hrs")
    const simpleHoursMatch = queryLower.match(standaloneHoursPattern);
    if (simpleHoursMatch && simpleHoursMatch[1]) {
      const hours = parseInt(simpleHoursMatch[1], 10);
      console.log(`Standalone hours detected: ${hours} hours`);
      
      // Get current time
      const currentTime = new Date();
      // Calculate checkout time (current time + specified hours)
      const checkoutHour = (currentTime.getHours() + hours) % 24;
      
      // Use processShortStayVoiceSearch with the calculated checkout hour
      const isPM = checkoutHour >= 12;
      processShortStayVoiceSearch(query, isPM ? (checkoutHour === 12 ? 12 : checkoutHour % 12) : checkoutHour, searchId, !isPM, isPM, false);
      return;
    }
    
    // Check for specific hour durations without jacuzzi (e.g., "6 hours")
    const specificHoursMatch = queryLower.match(specificHoursPattern);
    if (specificHoursMatch && specificHoursMatch[1]) {
      const hours = parseInt(specificHoursMatch[1], 10);
      console.log(`Specific hours detected: ${hours} hours`);
      
      // Get current time
      const currentTime = new Date();
      // Calculate checkout time (current time + specified hours)
      const checkoutHour = (currentTime.getHours() + hours) % 24;
      
      // Use processShortStayVoiceSearch with the calculated checkout hour
      const isPM = checkoutHour >= 12;
      processShortStayVoiceSearch(query, isPM ? (checkoutHour === 12 ? 12 : checkoutHour % 12) : checkoutHour, searchId, !isPM, isPM, false);
      return;
    }
    
    // Check for patterns that just mention time without explicitly saying "short stay"
    // First check for explicit AM time
    const justTimeAmMatch = queryLower.match(justTimeAmPattern);
    if (justTimeAmMatch && justTimeAmMatch[1]) {
      console.log('Just time mention with AM detected - treating as short stay');
      console.log('Just Time AM Match:', justTimeAmMatch);
      console.log('Hour:', parseInt(justTimeAmMatch[1], 10));
      
      // Check if query contains jacuzzi
      const hasJacuzzi = ['jacuzzi', 'hot tub', 'spa', 'whirlpool', 'jet tub'].some(term => 
        queryLower.includes(term)
      );
      
      processShortStayVoiceSearch(query, parseInt(justTimeAmMatch[1], 10), searchId, true, false, hasJacuzzi);
      return;
    }
    
    // Then check for explicit PM time
    const justTimePmMatch = queryLower.match(justTimePmPattern);
    if (justTimePmMatch && justTimePmMatch[1]) {
      console.log('Just time mention with PM detected - treating as short stay');
      console.log('Just Time PM Match:', justTimePmMatch);
      console.log('Hour:', parseInt(justTimePmMatch[1], 10));
      
      // Check if query contains jacuzzi
      const hasJacuzzi = ['jacuzzi', 'hot tub', 'spa', 'whirlpool', 'jet tub'].some(term => 
        queryLower.includes(term)
      );
      
      processShortStayVoiceSearch(query, parseInt(justTimePmMatch[1], 10), searchId, false, true, hasJacuzzi);
      return;
    }
    
    // Finally check for generic time (no AM/PM)
    const justTimeGenericMatch = queryLower.match(justTimeGenericPattern);
    if (justTimeGenericMatch && justTimeGenericMatch[1]) {
      console.log('Just time mention without AM/PM detected - treating as short stay');
      console.log('Just Time Generic Match:', justTimeGenericMatch);
      console.log('Hour:', parseInt(justTimeGenericMatch[1], 10));
      
      // Check if query contains jacuzzi
      const hasJacuzzi = ['jacuzzi', 'hot tub', 'spa', 'whirlpool', 'jet tub'].some(term => 
        queryLower.includes(term)
      );
      
      // For generic time, assume PM for hours 1-11 (more common for short stays)
      const isPM = (parseInt(justTimeGenericMatch[1], 10) >= 1 && parseInt(justTimeGenericMatch[1], 10) < 12);
      processShortStayVoiceSearch(query, parseInt(justTimeGenericMatch[1], 10), searchId, !isPM, isPM, hasJacuzzi);
      return;
    }
    
    } // End of else block for short stay processing
    
    // Note: We already checked for empty queries at the beginning of the function
    
    // CRITICAL CHECK: Direct check for "I want two rooms" or similar phrases
    // This is a high-priority check that will override other processing
    const twoRoomsDirectCheck = queryLower.trim();
    let forceRoomQuantity = null;
    let isStandaloneRoomQuantityRequest = false;
    
    // Direct checks for the most common phrases
    if (twoRoomsDirectCheck === 'i want two rooms' || 
        twoRoomsDirectCheck === 'i want 2 rooms' ||
        twoRoomsDirectCheck === 'i need two rooms' ||
        twoRoomsDirectCheck === 'get two rooms' ||
        twoRoomsDirectCheck === 'two rooms') {
      console.log('DIRECT MATCH for "two rooms" phrase');
      forceRoomQuantity = 2;
      isStandaloneRoomQuantityRequest = true;
    } else if (twoRoomsDirectCheck === 'i want three rooms' || 
               twoRoomsDirectCheck === 'i want 3 rooms' ||
               twoRoomsDirectCheck === 'three rooms' ||
               twoRoomsDirectCheck === '3 rooms') {
      console.log('DIRECT MATCH for "three rooms" phrase');
      forceRoomQuantity = 3;
      isStandaloneRoomQuantityRequest = true;
    }
    
    // Check if this is a standalone room quantity request and we have previous voice search results
    // If so, we'll preserve the dates from the previous search
    let preservedDates = null;
    if (isStandaloneRoomQuantityRequest && voiceSearchResults) {
      console.log('This appears to be a standalone room quantity request. Preserving dates from previous search.');
      preservedDates = {
        checkInDate: new Date(voiceSearchResults.checkInDate),
        checkOutDate: new Date(voiceSearchResults.checkOutDate),
        nights: voiceSearchResults.nights,
        roomType: voiceSearchResults.roomType,
        bedType: voiceSearchResults.bedType,
        hasJacuzzi: voiceSearchResults.hasJacuzzi,
        isSmoking: voiceSearchResults.isSmoking,
        dailyPrices: [...voiceSearchResults.dailyPrices]
      };
      console.log('Preserved dates:', preservedDates);
    }
    
    // Pre-process the query to normalize common speech recognition variations
    // This helps with phrases that might be transcribed differently than spoken
    let processedQuery = query;
    
    // Common variations for "two rooms"
    const twoRoomsVariations = [
      'to rooms', 'too rooms', '2 room', 'to room', 'too room',
      'two room', 'two-room', '2-room', 'second room', '2nd room',
      'i want to rooms', 'i need to rooms', 'i want too rooms',
      'i need too rooms', 'i want 2 room', 'i need 2 room'
    ];
    
    // Check for variations and normalize them
    for (const variation of twoRoomsVariations) {
      if (processedQuery.toLowerCase().includes(variation)) {
        console.log(`Found variation "${variation}" - normalizing to "two rooms"`);
        // Replace the variation with the standard form
        processedQuery = processedQuery.toLowerCase().replace(variation, 'two rooms');
        // Also update queryLower to match the new processedQuery
        // This ensures consistency for the rest of the function
        // Also force the room quantity to 2
        forceRoomQuantity = 2;
        break;
      }
    }
    
    // Log the pre-processing result
    if (processedQuery !== query) {
      console.log(`Original query: "${query}"`);
      console.log(`Processed query: "${processedQuery}"`);
      query = processedQuery; // Use the processed query for further processing
      // Update queryLower to match the new query
      queryLower = query.toLowerCase();
    }
    
    // If we have a forced room quantity, log it prominently
    if (forceRoomQuantity !== null) {
      console.log(`🔴 FORCED ROOM QUANTITY: ${forceRoomQuantity} 🔴`);
    }
    
    // Store the detected query for watermark display
    if (!detectedVoiceQuery) {
      setDetectedVoiceQuery({
        query: query,
        originalTranscript: query
      });
    }
    
    // We already converted query to lowercase at the beginning
    console.log('Processing voice query:', queryLower);
    
    // Define valid room types in the hotel
    const validRoomTypes = {
      'Queen': 'Standard Queen bed',
      'King': 'King size bed (fits 3 people)',
      'Queen2Beds': 'Queen room with 2 beds (fits 4 people)'
    };
    
    // Define valid room combinations
    const validCombinations = {
      'Queen-Jacuzzi': true,     // Queen with Jacuzzi exists
      'King-Jacuzzi': true,      // King with Jacuzzi exists
      'Queen2Beds-Jacuzzi': false // Queen 2 Beds with Jacuzzi does NOT exist
    };
    
    // Check for room quantity in the query (e.g., "I want 2 rooms", "I want two rooms", etc.)
    // If we have a forced room quantity from the direct check, use that
    let roomQuantity = forceRoomQuantity !== null ? forceRoomQuantity : 1;
    
    // Log if we're using a forced quantity
    if (forceRoomQuantity !== null) {
      console.log(`Using forced room quantity: ${roomQuantity}`);
    }
    
    // Function to convert word numbers to numeric values
    const wordToNumber = (word) => {
      const wordMap = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      return wordMap[word.toLowerCase()] || 0;
    };
    
    // Patterns for numeric values (e.g., "2 rooms")
    const numericPatterns = [
      /\b(\d+)\s+rooms?\b/i,                // "2 rooms"
      /\bwant\s+(\d+)\s+rooms?\b/i,         // "want 2 rooms"
      /\bneed\s+(\d+)\s+rooms?\b/i,         // "need 2 rooms"
      /\booking\s+(\d+)\s+rooms?\b/i,       // "booking 2 rooms"
      /\breserve\s+(\d+)\s+rooms?\b/i,      // "reserve 2 rooms"
      /\breserving\s+(\d+)\s+rooms?\b/i,    // "reserving 2 rooms"
      /\bget\s+(\d+)\s+rooms?\b/i           // "get 2 rooms"
    ];
    
    // Patterns for word-based numbers (e.g., "two rooms")
    const wordPatterns = [
      /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i,                // "two rooms"
      /\bwant\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i,         // "want two rooms"
      /\bneed\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i,         // "need two rooms"
      /\booking\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i,       // "booking two rooms"
      /\breserve\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i,      // "reserve two rooms"
      /\breserving\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i,    // "reserving two rooms"
      /\bget\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+rooms?\b/i           // "get two rooms"
    ];
    
    // Check numeric patterns first
    for (const pattern of numericPatterns) {
      const match = queryLower.match(pattern);
      if (match && match[1]) {
        const quantity = parseInt(match[1], 10);
        if (quantity > 0 && quantity <= 10) { // Reasonable limit
          roomQuantity = quantity;
          console.log(`Detected numeric room quantity: ${roomQuantity}`);
          break;
        }
      }
    }
    
    // If no numeric match, check word patterns
    if (roomQuantity === 1) {
      for (const pattern of wordPatterns) {
        const match = queryLower.match(pattern);
        if (match && match[1]) {
          const quantity = wordToNumber(match[1]);
          if (quantity > 0) { // Already limited to 10 in the regex
            roomQuantity = quantity;
            console.log(`Detected word-based room quantity: ${roomQuantity}`);
            break;
          }
        }
      }
    }
    
    // Add detailed logging to help debug
    console.log(`Final room quantity detected: ${roomQuantity}`);
    console.log(`Original query: "${query}"`);
    console.log(`Lowercase query: "${queryLower}"`);
    
    // Add special cases for common phrases - this is more reliable than regex in some cases
    // Map of phrases to their corresponding quantities
    const specialPhrases = {
      'i want two rooms': 2,
      'want two rooms': 2,
      'i need two rooms': 2,
      'need two rooms': 2,
      'get two rooms': 2,
      'book two rooms': 2,
      'reserve two rooms': 2,
      'two rooms': 2,
      'i want 2 rooms': 2,
      'want 2 rooms': 2,
      'i need 2 rooms': 2,
      'need 2 rooms': 2,
      'get 2 rooms': 2,
      'book 2 rooms': 2,
      'reserve 2 rooms': 2,
      '2 rooms': 2,
      'i want three rooms': 3,
      'want three rooms': 3,
      'i need three rooms': 3,
      'need three rooms': 3,
      'get three rooms': 3,
      'book three rooms': 3,
      'reserve three rooms': 3,
      'three rooms': 3,
      'i want 3 rooms': 3,
      'want 3 rooms': 3,
      'i need 3 rooms': 3,
      'need 3 rooms': 3,
      'get 3 rooms': 3,
      'book 3 rooms': 3,
      'reserve 3 rooms': 3,
      '3 rooms': 3
    };
    
    // Check if any special phrase is in the query
    for (const [phrase, quantity] of Object.entries(specialPhrases)) {
      if (queryLower.includes(phrase)) {
        console.log(`Special phrase match: "${phrase}" -> ${quantity} rooms`);
        roomQuantity = quantity;
        break;
      }
    }
    
    // Final check for any mention of "two" or "2" with "room"
    if (roomQuantity === 1 && 
        ((queryLower.includes('two') && queryLower.includes('room')) || 
         (queryLower.includes('2') && queryLower.includes('room')))) {
      console.log('Fallback match for "two rooms"');
      roomQuantity = 2;
    }
    
    // Initialize results object with a timestamp and searchId to ensure uniqueness
    let results = {
      query: query,
      timestamp: Date.now(), // Add timestamp to prevent caching issues
      searchId: searchId || `search-${Date.now()}`, // Use provided searchId or generate a new one
      nights: preservedDates ? preservedDates.nights : 1,
      roomQuantity: roomQuantity, // Add room quantity to results
      checkInDate: preservedDates ? new Date(preservedDates.checkInDate) : new Date(),
      checkOutDate: preservedDates ? new Date(preservedDates.checkOutDate) : new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      bedType: preservedDates ? preservedDates.bedType : 'Queen', // Use preserved bed type or default to Queen
      hasJacuzzi: preservedDates ? preservedDates.hasJacuzzi : false,
      isSmoking: preservedDates ? preservedDates.isSmoking : false, // Use preserved smoking preference or default to non-smoking
      price: 0,
      tax: 0,
      total: 0,
      dailyPrices: preservedDates ? [...preservedDates.dailyPrices] : [], // Use preserved daily prices or empty array
      foundMatch: false,
      validRoomTypes: validRoomTypes, // Add valid room types for reference
      validCombinations: validCombinations, // Add valid combinations for reference
      invalidRoomType: false, // Flag for invalid room type
      requestedInvalidType: '', // Store the invalid room type that was requested
      invalidCombination: false, // Flag for invalid room combination
      requestedInvalidCombination: '', // Store the invalid combination that was requested
      isStandaloneRoomQuantityRequest: isStandaloneRoomQuantityRequest // Flag to indicate this is a standalone room quantity request
    };
    
    // If this is a standalone room quantity request with preserved dates, log it
    if (isStandaloneRoomQuantityRequest && preservedDates) {
      console.log('Using preserved dates for standalone room quantity request:');
      console.log('Check-in:', results.checkInDate);
      console.log('Check-out:', results.checkOutDate);
      console.log('Nights:', results.nights);
      console.log('Room type:', results.bedType);
      console.log('Has jacuzzi:', results.hasJacuzzi);
      console.log('Is smoking:', results.isSmoking);
    }
    
    // Enhanced date detection for voice search
    const voiceToday = new Date();
    let voiceCheckInDate = new Date(voiceToday);
    let voiceCheckOutDate = new Date(voiceToday);
    let voiceNights = 1;
    let dateDetected = false;
    
    // Set default check-in to today at 3 PM and check-out to tomorrow at 11 AM
    voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
    voiceCheckOutDate.setDate(voiceToday.getDate() + 1);
    voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
    
    // Extract days of the week
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndices = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    const mentionedDays = [];
    
    // Define months for date parsing
    const months = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    // COMPLETELY REWRITTEN DAY DETECTION LOGIC
    // First, check if the query contains the word "next"
    const hasNextKeyword = queryLower.includes('next');
    
    // Check for specific days mentioned in the query
    const mentionedDaysInQuery = daysOfWeek.filter(day => queryLower.includes(day));
    console.log('Days mentioned in query:', mentionedDaysInQuery);
    
    // If we have days mentioned and the "next" keyword, process them
    if (mentionedDaysInQuery.length > 0) {
      dateDetected = true;
      
      // Check for specific "next [day]" pattern
      const nextDayPattern = /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
      const nextDayMatches = [...queryLower.matchAll(nextDayPattern)];
      const explicitNextDays = nextDayMatches.map(match => match[1].toLowerCase());
      
      // Determine if all days should be treated as "next week"
      // This happens if:
      // 1. The query has "next" and multiple days (e.g., "next Monday, Wednesday and Friday")
      // 2. Any day is explicitly marked as "next" (e.g., "next Monday")
      const allDaysAreNextWeek = 
        (hasNextKeyword && mentionedDaysInQuery.length > 1) || 
        (explicitNextDays.length > 0);
      
      // Process each mentioned day
      mentionedDaysInQuery.forEach(day => {
        // A day is "next week" if all days are next week or if it's explicitly marked as "next"
        const isExplicitlyNext = explicitNextDays.includes(day);
        const isNextWeek = allDaysAreNextWeek || isExplicitlyNext;
        
        mentionedDays.push({ day, isNextWeek });
      });
    }
    
    console.log('Processed mentioned days:', mentionedDays);
    
    // Check for specific date mentions (e.g., "26th June", "June 15 and June 16th")
    let specificDateDetected = false;
    const datePatterns = [
      // Format: "26th June", "26 June", "June 26th", "June 26"
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    ];
    
    // Array to store multiple detected dates
    const detectedDates = [];
    
    // Function to extract a date from text using the patterns
    const extractDate = (text) => {
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          let day, month;
          
          if (match[1] && isNaN(parseInt(match[1]))) {
            // Month is first (e.g., "June 26th")
            month = months[match[1].toLowerCase()];
            day = parseInt(match[2]);
          } else {
            // Day is first (e.g., "26th June")
            day = parseInt(match[1]);
            month = months[match[2].toLowerCase()];
          }
          
          // Validate day of month
          if (day >= 1 && day <= 31) {
            return { day, month };
          }
        }
      }
      return null;
    };
    
    // Check if we have multiple dates with "and" between them
    if (queryLower.includes(' and ')) {
      console.log('Detected potential multiple dates with "and"');
      
      // Split the query by "and" to check for multiple dates
      const parts = queryLower.split(' and ');
      
      let lastKnownMonth = null;
      let potentialYearForShortDates = null; // Store year if month rollover occurs

      for (const part of parts) {
        let dateInfo = extractDate(part.trim()); // Try to extract full date first
        if (dateInfo) {
          detectedDates.push(dateInfo);
          lastKnownMonth = dateInfo.month;
          // Determine if this date implies a year rollover for subsequent short dates
          const tempDate = new Date(voiceToday.getFullYear(), dateInfo.month, dateInfo.day);
          if (tempDate < voiceToday && dateInfo.month < voiceToday.getMonth()) {
            potentialYearForShortDates = voiceToday.getFullYear() + 1;
          } else if (tempDate < voiceToday && dateInfo.month === voiceToday.getMonth() && dateInfo.day < voiceToday.getDate()) {
            potentialYearForShortDates = voiceToday.getFullYear() + 1;
          } else {
            potentialYearForShortDates = voiceToday.getFullYear();
          }

        } else if (lastKnownMonth !== null) {
          // If full date extraction failed, try to parse just a day number, using the last known month
          const dayOnlyMatch = part.trim().match(/^(\d{1,2})(?:st|nd|rd|th)?$/i);
          if (dayOnlyMatch) {
            const day = parseInt(dayOnlyMatch[1]);
            if (day >= 1 && day <= 31) {
              console.log(`Extracted day ${day} using last known month ${Object.keys(months).find(key => months[key] === lastKnownMonth)}`);
              detectedDates.push({ day, month: lastKnownMonth, impliedYear: potentialYearForShortDates });
            }
          }
        }
      }
      
      // If we found multiple dates, set the flag
      if (detectedDates.length > 1) {
        specificDateDetected = true;
        dateDetected = true;
        console.log(`Detected ${detectedDates.length} specific dates: `, detectedDates);
      }
    }
    
    // If we didn't find multiple dates, try to find a single date
    if (!specificDateDetected) {
      const dateInfo = extractDate(queryLower);
      if (dateInfo) {
        detectedDates.push(dateInfo);
        specificDateDetected = true;
        dateDetected = true;
      }
    }
    
    // If specific date(s) detected, set check-in and check-out dates
    if (specificDateDetected && detectedDates.length > 0) {
      // Default to current year
      const currentYear = voiceToday.getFullYear();
      
      // Sort dates chronologically
      const datesWithYear = detectedDates.map(dateInfo => {
        let year = currentYear;
        
        // If the month is earlier than current month, assume next year
        if (dateInfo.month < voiceToday.getMonth()) {
          year++;
        }
        // If same month but day has passed, assume next year
        else if (dateInfo.month === voiceToday.getMonth() && dateInfo.day < voiceToday.getDate()) {
          year++;
        }
        
        // Use impliedYear if it was set during parsing of short dates (e.g. June 30th and 1st -> 1st is July)
        // Or if the dateInfo itself implies a year for a full date mention
        let finalYear = dateInfo.impliedYear || year;
        
        // If the original dateInfo had a month and day that implies next year, prioritize that
        if (!dateInfo.impliedYear) { // only re-evaluate year if not already implied
            if (dateInfo.month < voiceToday.getMonth()) {
                finalYear = currentYear + 1;
            }
            else if (dateInfo.month === voiceToday.getMonth() && dateInfo.day < voiceToday.getDate()) {
                finalYear = currentYear + 1;
            }
        }

        return {
          ...dateInfo,
          year: finalYear,
          date: new Date(finalYear, dateInfo.month, dateInfo.day)
        };
      });
      
      // Sort by date
      datesWithYear.sort((a, b) => a.date - b.date);
      
      console.log('Sorted dates with year:', datesWithYear.map(d => d.date.toDateString()));
      
      // Handle multiple dates (e.g., "June 15 and June 16")
      if (datesWithYear.length > 1) {
        // First date is check-in
        const firstDate = datesWithYear[0];
        // Last date is the last night of stay
        const lastDate = datesWithYear[datesWithYear.length - 1];
        
        // Set check-in date to the first specific date at 3 PM
        voiceCheckInDate = new Date(firstDate.year, firstDate.month, firstDate.day, 15, 0, 0, 0);
        
        // Set check-out date to the day after the last specific date at 11 AM
        voiceCheckOutDate = new Date(lastDate.year, lastDate.month, lastDate.day);
        voiceCheckOutDate.setDate(voiceCheckOutDate.getDate() + 1);
        voiceCheckOutDate.setHours(11, 0, 0, 0);
        
        // Calculate nights based on the number of dates mentioned
        voiceNights = datesWithYear.length;
        
        console.log(`Multiple specific dates detected: Check-in ${voiceCheckInDate.toDateString()}, Check-out ${voiceCheckOutDate.toDateString()}, Nights: ${voiceNights}`);
      } 
      // Handle single date
      else {
        const dateInfo = datesWithYear[0];
        
        // Set check-in date to the specific date at 3 PM
        voiceCheckInDate = new Date(dateInfo.year, dateInfo.month, dateInfo.day, 15, 0, 0, 0);
        
        // Set check-out date to the next day at 11 AM
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 1);
        voiceCheckOutDate.setHours(11, 0, 0, 0);
        
        voiceNights = 1;
        console.log(`Single specific date detected: ${voiceCheckInDate.toDateString()}`);
      }
    }
    // Check for "today and tomorrow" first
    if (queryLower.includes('today') && queryLower.includes('tomorrow')) {
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in today
      
      // Set check-out to the day after tomorrow at 11 AM
      voiceCheckOutDate = new Date(voiceCheckInDate);
      voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 2);
      voiceCheckOutDate.setHours(11, 0, 0, 0);
      
      voiceNights = 2; // Today and tomorrow = 2 nights
      dateDetected = true;
      console.log('Detected "today and tomorrow" - setting 2 nights');
    }
    // Check for "tomorrow"
    else if (queryLower.includes('tomorrow') && !queryLower.includes('today')) {
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setDate(voiceToday.getDate() + 1);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      voiceCheckOutDate = new Date(voiceCheckInDate);
      voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 1);
      voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
      
      voiceNights = 1;
      dateDetected = true;
    }
    // Check for "today"
    else if (queryLower.includes('today') && !queryLower.includes('tomorrow')) {
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      voiceCheckOutDate = new Date(voiceCheckInDate);
      voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 1);
      voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
      
      voiceNights = 1;
      dateDetected = true;
    }
    // Enhanced handling for "next week", "next seven days", "next whole week", "next X days", etc.
    // Check for phrases indicating a 7-night stay starting from a specific day
    const sevenNightPhrases = [
      'next whole week', 'next full week', 'next entire week', 'next all week', 'next week long',
      'whole next week', 'full next week', 'entire next week', 'all next week', 'week long next',
      'next seven days', 'next 7 days', 'seven days', '7 days', 'for seven days', 'for 7 days',
      'next seven nights', 'next 7 nights', 'seven nights', '7 nights', 'for seven nights', 'for 7 nights',
      'one week', 'a week', 'for a week', 'for one week'
    ];
    
    // Check for "next X days" pattern
    const nextXDaysPattern = /\bnext\s+(\d+)\s+(?:days|nights)\b/i;
    const nextXDaysMatch = queryLower.match(nextXDaysPattern);
    let customNights = 0;
    
    if (nextXDaysMatch && nextXDaysMatch[1]) {
      customNights = parseInt(nextXDaysMatch[1], 10);
      console.log(`Detected request for next ${customNights} days/nights`);
    }
    
    // Also check for "for X days" pattern
    const forXDaysPattern = /\bfor\s+(\d+)\s+(?:days|nights)\b/i;
    const forXDaysMatch = queryLower.match(forXDaysPattern);
    
    if (!customNights && forXDaysMatch && forXDaysMatch[1]) {
      customNights = parseInt(forXDaysMatch[1], 10);
      console.log(`Detected request for ${customNights} days/nights`);
    }
    
    const hasSevenNightPhrase = sevenNightPhrases.some(phrase => queryLower.includes(phrase));
    
    // Check for "next week", "next X days", or other similar phrases
    if (queryLower.includes('next week') || hasSevenNightPhrase || customNights > 0) {
      console.log('Processing multi-night stay (next week, X nights, etc.). Current dateDetected:', dateDetected, 'customNights:', customNights, 'hasSevenNightPhrase:', hasSevenNightPhrase);

      // If no specific start date (like "Monday", "tomorrow", "June 10th") was parsed yet, determine start date based on phrase.
      if (!dateDetected) {
        if (nextXDaysMatch) { // "next X nights"
          voiceCheckInDate = new Date(voiceToday); // Base on today
          voiceCheckInDate.setDate(voiceToday.getDate() + 1); // Start tomorrow
          console.log('No prior date detected. "next X nights" starts tomorrow:', voiceCheckInDate.toDateString());
        } else if (queryLower.includes('next week') && !customNights && !hasSevenNightPhrase) { 
          // Specifically "next week" and not also "next 7 nights" (which customNights would catch)
          voiceCheckInDate = new Date(voiceToday); // Base on today
          const currentDayIndex = voiceToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
          let offset = (8 - currentDayIndex) % 7;
          if (offset === 0) offset = 7; // If today is Monday, next Monday is 7 days away
          voiceCheckInDate.setDate(voiceToday.getDate() + offset);
          console.log('No prior date detected. "next week" starts next Monday:', voiceCheckInDate.toDateString());
        } else if (customNights > 0 || hasSevenNightPhrase) {
          // "for X nights", "X nights", or generic "seven nights" phrase - default to today if no prior date.
          voiceCheckInDate = new Date(voiceToday); // Start today
          console.log('No prior date detected. "X nights" or "seven nights" starts today:', voiceCheckInDate.toDateString());
        }
      } else {
        // A specific start date was already detected (e.g., "from Monday", "tomorrow", "June 10th").
        // voiceCheckInDate is already set to this specific date. We will use it.
        console.log(`Prior date detected (${voiceCheckInDate.toDateString()}), using it as start date.`);
      }

      voiceCheckInDate.setHours(15, 0, 0, 0); // Ensure 3 PM check-in time for the determined start date

      // Determine number of nights
      let nightsToStay = 0;
      if (customNights > 0) { // "X nights", "for X nights", "next X nights"
        nightsToStay = customNights;
        console.log(`Using customNights: ${nightsToStay}`);
      } else if (hasSevenNightPhrase || queryLower.includes('next week')) {
        // Generic "seven nights" phrase or "next week" (if no custom nights specified for it)
        nightsToStay = 7;
        console.log('Using 7 nights for sevenNightPhrase or "next week".');
      }

      if (nightsToStay > 0) {
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + nightsToStay);
        voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        voiceNights = nightsToStay;
        console.log(`Finalizing: ${voiceNights} nights. Check-in: ${voiceCheckInDate.toDateString()}, Check-out: ${voiceCheckOutDate.toDateString()}`);
        dateDetected = true; // We have successfully processed dates for this multi-night stay.
      } else {
        console.warn("Could not determine nightsToStay in multi-night block. Date not fully detected.");
      }
    }
    // Check for "weekend"
    else if (queryLower.includes('weekend')) {
      const currentDayIndex = voiceToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
      let daysUntilFriday = 5 - currentDayIndex;
      if (daysUntilFriday <= 0) daysUntilFriday += 7; // If it's Friday or after, go to next week
      
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setDate(voiceToday.getDate() + daysUntilFriday);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      voiceCheckOutDate = new Date(voiceCheckInDate);
      voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 2); // Friday to Sunday
      voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
      
      voiceNights = 2;
      dateDetected = true;
    }
    // Process specific days of the week if mentioned
    else if (mentionedDays.length > 0) {
      console.log('Processing multiple day mentions for check-in/check-out calculation');
      
      // Get the current day of the week (0-6, Sunday-Saturday)
      const currentDayIndex = voiceToday.getDay();
      console.log('Current day index:', currentDayIndex, '(', daysOfWeek[currentDayIndex], ')');
      
      // STEP 1: Convert day names to their indices and mark if they're for next week
      const dayObjects = mentionedDays.map(d => ({
        name: d.day,
        index: dayIndices[d.day],
        isNextWeek: d.isNextWeek
      }));
      
      console.log('Day objects:', dayObjects);
      
      // STEP 2: Sort days chronologically
      // First by week (current week first, next week second)
      // Then by day index within each week
      const sortedDays = [...dayObjects].sort((a, b) => {
        if (a.isNextWeek !== b.isNextWeek) {
          return a.isNextWeek ? 1 : -1; // Next week days come after current week days
        }
        return a.index - b.index; // Sort by day index within the same week
      });
      
      console.log('Sorted days:', sortedDays);
      
      // STEP 3: Get the first and last days for check-in and check-out
      const firstDay = sortedDays[0];
      const lastDay = sortedDays[sortedDays.length - 1];
      
      console.log('First day:', firstDay.name, 'Last day:', lastDay.name);
      
      // STEP 4: Calculate the check-in date based on the first day
      
      // Calculate days until check-in
      let daysUntilCheckIn;
      if (firstDay.isNextWeek) {
        // For "next [day]", find the day in the next week
        daysUntilCheckIn = (firstDay.index - currentDayIndex + 7) % 7;
        if (daysUntilCheckIn === 0) daysUntilCheckIn = 7; // If same day, go to next week
      } else {
        // For regular days, find the next occurrence
        daysUntilCheckIn = firstDay.index - currentDayIndex;
        if (daysUntilCheckIn <= 0) daysUntilCheckIn += 7; // If day has passed, go to next week
      }
      
      // Set check-in date
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setDate(voiceToday.getDate() + daysUntilCheckIn);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      console.log('Check-in date:', voiceCheckInDate.toDateString(), 'Days until check-in:', daysUntilCheckIn);
      
      // STEP 5: Calculate the number of nights and check-out date
      
      // For random days like "Monday, Tuesday, Friday", we want to only count the specific days mentioned
      let nightsCount;
      
      // If we have multiple days mentioned
      if (sortedDays.length > 1) {
        // Use the improved non-consecutive days detection
        const isNonConsecutive = isNonConsecutiveDaysQuery(queryLower, sortedDays);
        
        // If the query indicates non-consecutive days (has "and", commas, or days aren't consecutive)
        if (isNonConsecutive) {
          // Only count the specific days mentioned
          nightsCount = sortedDays.length;
          console.log('Non-consecutive days detected, counting ONLY the mentioned days:', sortedDays.map(d => d.name).join(', '));
          
          // For non-consecutive days, we want to override how we calculate nights
          // to make sure it's exactly the number of mentioned days
          voiceNights = sortedDays.length;
        } else {
          // For consecutive days, calculate the span
          if (firstDay.isNextWeek === lastDay.isNextWeek) {
            // Calculate nights from first to last day
            let dayDiff = lastDay.index - firstDay.index;
            if (dayDiff < 0) dayDiff += 7; // Handle week wrap-around
            nightsCount = dayDiff + 1; // Add 1 because we're staying the last night too
          } 
          // If days span across weeks
          else {
            // Calculate days in current week + days in next week
            nightsCount = (7 - firstDay.index) + lastDay.index + 1;
          }
          console.log('Consecutive days detected, calculating span from first to last day:', sortedDays.map(d => d.name).join(', '));
        }
      } else {
        // If only one day mentioned, assume 1 night stay
        nightsCount = 1;
      }
      
      console.log('Number of nights calculated:', nightsCount);
      
      // STEP 6: Set the check-out date
      // Use our improved detection for non-consecutive days
      const isNonConsecutive = isNonConsecutiveDaysQuery(queryLower, sortedDays);
      
      // Store the non-consecutive days flag and the mentioned days in the results object
      // so we can use them when calculating daily prices
      results.isNonConsecutiveDays = isNonConsecutive;
      
      // If this is a non-consecutive days request, we need to store information about the exact days
      // to build an accurate daily price breakdown that only shows the requested days
      if (isNonConsecutive) {
        // Create an array of specific dates for each mentioned day
        const exactDates = [];
        
        for (const dayObj of sortedDays) {
          // Calculate the date for this specific day
          const specificDate = new Date(voiceToday);
          let daysUntilThisDay;
          
          if (dayObj.isNextWeek) {
            // For days in next week
            daysUntilThisDay = (dayObj.index - currentDayIndex + 7) % 7;
            if (daysUntilThisDay === 0) daysUntilThisDay = 7;
          } else {
            // For days in current week
            daysUntilThisDay = dayObj.index - currentDayIndex;
            if (daysUntilThisDay <= 0) daysUntilThisDay += 7;
          }
          
          specificDate.setDate(voiceToday.getDate() + daysUntilThisDay);
          specificDate.setHours(15, 0, 0, 0); // 3 PM
          
          exactDates.push({
            name: dayObj.name,
            date: new Date(specificDate),
            dayIndex: dayObj.index
          });
        }
        
        // Sort dates chronologically
        exactDates.sort((a, b) => a.date - b.date);
        
        // Store these in the results
        results.exactDates = exactDates;
        console.log('Exact dates for non-consecutive request:', 
                   exactDates.map(d => `${d.name}: ${d.date.toDateString()}`));
      }
      
      // Store the list of day names
      results.mentionedDays = sortedDays.map(d => d.name);
      
      if (isNonConsecutive && sortedDays.length > 1) {
        // For non-consecutive days, set checkout to the day after the last mentioned day
        const lastDayDate = new Date(voiceToday);
        let daysUntilLastDay;
        
        if (lastDay.isNextWeek) {
          daysUntilLastDay = (lastDay.index - currentDayIndex + 7) % 7;
          if (daysUntilLastDay === 0) daysUntilLastDay = 7;
        } else {
          daysUntilLastDay = lastDay.index - currentDayIndex;
          if (daysUntilLastDay <= 0) daysUntilLastDay += 7;
        }
        
        lastDayDate.setDate(voiceToday.getDate() + daysUntilLastDay);
        
        // Set checkout to the day after the last mentioned day
        voiceCheckOutDate = new Date(lastDayDate);
        voiceCheckOutDate.setDate(lastDayDate.getDate() + 1);
        voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        
        console.log('Non-consecutive days: Setting checkout to day after last mentioned day:', voiceCheckOutDate.toDateString());
      } else {
        // For consecutive days or single day, use normal calculation
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + nightsCount);
        voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
      }
      
      voiceNights = nightsCount;
      console.log('Check-out date:', voiceCheckOutDate.toDateString(), 'Total nights:', voiceNights);
    }
    
    // Set the dates in the results object
    results.checkInDate = voiceCheckInDate;
    results.checkOutDate = voiceCheckOutDate;
    results.nights = voiceNights;
    
    console.log('Date detection results:', {
      checkInDate: voiceCheckInDate.toDateString(),
      checkOutDate: voiceCheckOutDate.toDateString(),
      nights: voiceNights,
      dateDetected
    });
    
    // Extract bed type with improved detection logic and validation
    console.log('Voice query for bed type detection:', queryLower);
  
    // Advanced NLP-based room type detection system with improved Queen vs King disambiguation
    let detectedBedType = 'Queen'; // Default
    let invalidRoomTypeRequested = false;
    let requestedInvalidType = '';
  
    // Specific checks for King bed with common speech recognition confusions
    const kingIndicators = ['king', 'kings', 'keen', 'kin', 'kim', 'kingdom'];
    const queenIndicators = ['queen', 'queens', 'clean', 'cream', 'green'];
  
    // Count occurrences of king and queen indicators
    let kingScore = 0;
    let queenScore = 0;
  
    // Check for king indicators
    kingIndicators.forEach(indicator => {
      // Use word boundary to avoid partial matches
      const regex = new RegExp('\\b' + indicator + '\\b', 'gi');
      const matches = queryLower.match(regex);
      if (matches) kingScore += matches.length;
    });
  
    // Check for queen indicators
    queenIndicators.forEach(indicator => {
      const regex = new RegExp('\\b' + indicator + '\\b', 'gi');
      const matches = queryLower.match(regex);
      if (matches) queenScore += matches.length;
    });
  
    console.log(`Bed type detection scores - King: ${kingScore}, Queen: ${queenScore}`);
  
    // Determine bed type based on scores
    if (kingScore > queenScore) {
      detectedBedType = 'King';
      console.log('Detected King bed based on indicators');
    } else if (queenScore > 0) {
      detectedBedType = 'Queen';
      console.log('Detected Queen bed based on indicators');
    }
    
    // Define room type patterns with keywords, weights, and patterns
    const roomTypePatterns = {
      'Queen': {
        keywords: ['queen', 'queens', 'queen bed', 'standard'],
        patterns: [/\bqueen\b/i, /\bqueens\b/i, /\bqueen bed\b/i, /\bstandard\b/i],
        weight: 0,
        negations: [/\btwo queen\b/i, /\b2 queen\b/i, /\bdouble queen\b/i]
      },
      'King': {
        keywords: ['king', 'kings', 'king bed', 'king size', 'large bed'],
        patterns: [/\bking\b/i, /\bkings\b/i, /\bking bed\b/i, /\bking size\b/i, /\blarge bed\b/i],
        weight: 0,
        negations: []
      },
      'Queen2Beds': {
        keywords: ['double', 'two beds', '2 beds', 'two queen', '2 queen', 'double queen', 'two bed', '2 bed', 'double bed'],
        patterns: [/\bdouble\b/i, /\btwo beds?\b/i, /\b2 beds?\b/i, /\btwo queen\b/i, /\b2 queen\b/i, /\bdouble queen\b/i],
        weight: 0,
        negations: []
      },
      'Invalid': {
        keywords: ['suite', 'penthouse', 'twin', 'single'],
        patterns: [/\bsuite\b/i, /\bpenthouse\b/i, /\btwin\b/i, /\bsingle\b/i],
        weight: 0,
        negations: []
      }
    };
    
    // Calculate weights for each room type
    for (const [roomType, data] of Object.entries(roomTypePatterns)) {
      // Check for keyword matches
      for (const keyword of data.keywords) {
        if (queryLower.includes(keyword)) {
          roomTypePatterns[roomType].weight += 1;
          console.log(`Match found for ${roomType}: '${keyword}'`);
        }
      }
      
      // Check for pattern matches (more accurate with word boundaries)
      for (const pattern of data.patterns) {
        if (pattern.test(queryLower)) {
          roomTypePatterns[roomType].weight += 2; // Patterns have higher weight
          console.log(`Pattern match for ${roomType}: ${pattern}`);
        }
      }
      
      // Check for negations
      for (const negation of data.negations) {
        if (negation.test(queryLower)) {
          roomTypePatterns[roomType].weight -= 3; // Strong negative weight
          console.log(`Negation found for ${roomType}: ${negation}`);
        }
      }
      
      // Context-based adjustments
      if (roomType === 'Queen2Beds') {
        // If user mentions capacity for 3-4 people, boost Queen2Beds
        if (/\b(for|fits|sleeps|accommodates)\s+([34]|three|four)\s+(people|persons|guests)\b/i.test(queryLower)) {
          roomTypePatterns[roomType].weight += 3;
          console.log(`Capacity context boost for ${roomType}`);
        }
      }
    }
    
    // Check for invalid room types first
    if (roomTypePatterns['Invalid'].weight > 0) {
      invalidRoomTypeRequested = true;
      
      // Determine which invalid type was requested
      if (queryLower.includes('suite')) requestedInvalidType = 'Suite';
      else if (queryLower.includes('penthouse')) requestedInvalidType = 'Penthouse';
      else if (queryLower.includes('twin')) requestedInvalidType = 'Twin beds';
      else if (queryLower.includes('single')) requestedInvalidType = 'Single bed';
      
      console.log('Invalid room type requested:', requestedInvalidType);
      
      // Suggest a suitable alternative
      if (queryLower.includes('twin') || queryLower.includes('single')) {
        detectedBedType = 'Queen2Beds'; // Suggest Queen2Beds for twin/single requests
      }
    } else {
      // Find the room type with the highest weight
      let highestWeight = -1;
      let selectedType = 'Queen'; // Default
      
      for (const [roomType, data] of Object.entries(roomTypePatterns)) {
        if (roomType !== 'Invalid' && data.weight > highestWeight) {
          highestWeight = data.weight;
          selectedType = roomType;
        }
      }
      
      // Only use detected type if we have reasonable confidence (weight > 0)
      detectedBedType = highestWeight > 0 ? selectedType : 'Queen';
      console.log(`Selected room type: ${detectedBedType} with confidence weight: ${highestWeight}`);
    }
    
    // Special case for 'double' without other context
    if (queryLower.includes('double') && !queryLower.includes('queen') && !queryLower.includes('king')) {
      console.log('Special case: Double without bed type specified');
      detectedBedType = 'Queen2Beds';
    }
    
    // Set the bed type and validation flags
    results.bedType = detectedBedType;
    results.invalidRoomType = invalidRoomTypeRequested;
    results.requestedInvalidType = requestedInvalidType;
    console.log('Final bed type selected:', results.bedType);
    console.log('Invalid room type?', results.invalidRoomType);
    
    // Advanced feature detection using NLP techniques
    // Define feature patterns with keywords, patterns, and confidence scoring
    const featurePatterns = {
      'Jacuzzi': {
        keywords: ['jacuzzi', 'hot tub', 'spa', 'whirlpool', 'jet tub'],
        patterns: [/\bjacuzzi\b/i, /\bhot tub\b/i, /\bspa\b/i, /\bwhirlpool\b/i],
        negations: [/\bno jacuzzi\b/i, /\bwithout jacuzzi\b/i, /\bno hot tub\b/i],
        weight: 0
      },
      // Removed smoking option as requested - default is non-smoking
    };
    
    // Calculate weights for each feature
    for (const [feature, data] of Object.entries(featurePatterns)) {
      // Check for keyword matches
      for (const keyword of data.keywords) {
        if (queryLower.includes(keyword)) {
          featurePatterns[feature].weight += 1;
          console.log(`Match found for ${feature}: '${keyword}'`);
        }
      }
      
      // Check for pattern matches (more accurate with word boundaries)
      for (const pattern of data.patterns) {
        if (pattern.test(queryLower)) {
          featurePatterns[feature].weight += 2; // Patterns have higher weight
          console.log(`Pattern match for ${feature}: ${pattern}`);
        }
      }
      
      // Check for negations
      for (const negation of data.negations) {
        if (negation.test(queryLower)) {
          featurePatterns[feature].weight = -3; // Strong negative weight overrides positives
          console.log(`Negation found for ${feature}: ${negation}`);
        }
      }
    }
    
    // Set feature values based on weights
    results.hasJacuzzi = featurePatterns['Jacuzzi'].weight > 0;
    // Always set isSmoking to false as requested - non-smoking only
    results.isSmoking = false;
    
    console.log(`Jacuzzi detection: ${results.hasJacuzzi} (weight: ${featurePatterns['Jacuzzi'].weight})`);
    console.log('Smoking detection: false (default non-smoking)');
    
    // Check for invalid combinations
    if (results.hasJacuzzi) {
      const combinationKey = `${results.bedType}-Jacuzzi`;
      console.log('Checking combination:', combinationKey);
      
      if (validCombinations[combinationKey] === false) {
        console.log('Invalid combination detected:', combinationKey);
        results.invalidCombination = true;
        results.requestedInvalidCombination = `${results.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : results.bedType} with Jacuzzi`;
        
        // Suggest an alternative
        if (results.bedType === 'Queen2Beds') {
          // If they asked for Queen 2 Beds with Jacuzzi (which doesn't exist),
          // suggest either Queen with Jacuzzi or King with Jacuzzi
          results.bedType = 'Queen';
          results.hasJacuzzi = true;
        }
      }
    }
    
    // Calculate price based on extracted information
    const roomPrices = results.hasJacuzzi ? 
      { weekday: prices.weekday.withJacuzzi, friday: prices.friday.withJacuzzi, weekend: prices.weekend.withJacuzzi } :
      { weekday: prices.weekday.withoutJacuzzi, friday: prices.friday.withoutJacuzzi, weekend: prices.weekend.withoutJacuzzi };
    
    // Calculate base price
    let basePrice = 0;
    const checkInDate = new Date(results.checkInDate);
    
    // Day names for display
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Clear daily prices array if this is a standalone room quantity request
    // We need to recalculate it even if we preserved dates
    if (isStandaloneRoomQuantityRequest) {
      console.log('Clearing daily prices array for standalone room quantity request');
      results.dailyPrices = [];
    }
    
    // If this is a standalone room quantity request and we have preserved dates,
    // we can use the preserved daily prices to calculate the base price more accurately
    if (isStandaloneRoomQuantityRequest && preservedDates && preservedDates.dailyPrices && preservedDates.dailyPrices.length > 0) {
      console.log('Using preserved daily prices to calculate base price');
      
      // Use the preserved daily prices but recalculate the base price
      for (const dayPrice of preservedDates.dailyPrices) {
        // Create a new day price object with the same values
        results.dailyPrices.push({
          date: dayPrice.date,
          dayOfWeek: dayPrice.dayOfWeek,
          dayType: dayPrice.dayType,
          basePrice: dayPrice.basePrice,
          bedTypeSurcharge: dayPrice.bedTypeSurcharge,
          price: dayPrice.price
        });
        
        basePrice += dayPrice.price;
      }
    } else {
      // Check if this is a non-consecutive days request
      const nonConsecutiveDaysRequest = results.isNonConsecutiveDays;
      
      if (nonConsecutiveDaysRequest && results.exactDates && results.exactDates.length > 0) {
        console.log('Calculating prices using exact dates for non-consecutive days');
        
        // Clear the daily prices array first
        results.dailyPrices = [];
        basePrice = 0;
        
        // Use the exact dates we already calculated and stored in the results object
        for (const dateInfo of results.exactDates) {
          const currentDate = new Date(dateInfo.date);
          const dayOfWeek = currentDate.getDay();
          
          let dayPrice = 0;
          let dayType = '';
          
          if (dayOfWeek === 5) { // Friday
            dayPrice = roomPrices.friday;
            dayType = 'Friday';
          } else if (dayOfWeek === 6) { // Sunday or Saturday
            dayPrice = roomPrices.weekend;
            dayType = 'Weekend';
          } else { // Weekday (including Sunday)
            dayPrice = roomPrices.weekday;
            dayType = 'Weekday';
          }
          
          // Add bed type surcharge
          let baseDayPrice = dayPrice;
          if (results.bedType === 'King') {
            dayPrice += 5; // $5 extra per night for King
          } else if (results.bedType === 'Queen2Beds') {
            dayPrice += 10; // $10 extra per night for Queen 2 Beds
          }
          
          // Add to daily prices array
          results.dailyPrices.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dayOfWeek: dayNames[dayOfWeek],
            dayType: dayType,
            basePrice: baseDayPrice,
            bedTypeSurcharge: dayPrice - baseDayPrice,
            price: dayPrice
          });
          
          basePrice += dayPrice;
        }
      } else {
        // Calculate daily prices normally for consecutive days
        for (let i = 0; i < results.nights; i++) {
          const currentDate = new Date(checkInDate);
          currentDate.setDate(checkInDate.getDate() + i);
          const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
          let dayPrice = 0;
          let dayType = '';
          
          if (dayOfWeek === 5) { // Friday
            dayPrice = roomPrices.friday;
            dayType = 'Friday';
          } else if (dayOfWeek === 6) { // Saturday only (Sunday is now a weekday)
            dayPrice = roomPrices.weekend;
            dayType = 'Weekend';
          } else { // Weekday (including Sunday)
            dayPrice = roomPrices.weekday;
            dayType = 'Weekday';
          }
          
          // Add bed type surcharge
          let baseDayPrice = dayPrice;
          if (results.bedType === 'King') {
            dayPrice += 5; // $5 extra per night for King
          } else if (results.bedType === 'Queen2Beds') {
            dayPrice += 10; // $10 extra per night for Queen 2 Beds
          }
          
          // Add to daily prices array
          results.dailyPrices.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dayOfWeek: dayNames[dayOfWeek],
            dayType: dayType,
            basePrice: baseDayPrice,
            bedTypeSurcharge: dayPrice - baseDayPrice,
            price: dayPrice
          });
          
          basePrice += dayPrice;
        }
      }
    }
    
    // Store the single room price before applying quantity
    const singleRoomBasePrice = basePrice;
    const singleRoomTax = singleRoomBasePrice * 0.15;
    const singleRoomTotal = singleRoomBasePrice + singleRoomTax;
    
    // Apply room quantity to the price
    const totalBasePrice = singleRoomBasePrice * results.roomQuantity;
    const totalTax = totalBasePrice * 0.15;
    const grandTotal = totalBasePrice + totalTax;
    
    // Set price information
    results.singleRoomPrice = singleRoomBasePrice; // Price for a single room
    results.singleRoomTax = singleRoomTax;
    results.singleRoomTotal = singleRoomTotal;
    
    results.price = totalBasePrice; // Total price for all rooms
    results.tax = totalTax;
    results.total = grandTotal;
    results.foundMatch = true;
    
    // Set the final results with forced state update to prevent caching
    results.foundMatch = true;
    // Include room quantity in the unique ID to ensure different quantities create different results
    results.uniqueId = `result-${Date.now()}-qty${results.roomQuantity}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Store the results in session storage as a backup
    try {
      const resultsKey = `voice-results-${results.uniqueId}`;
      sessionStorage.setItem(resultsKey, JSON.stringify(results));
      console.log(`Stored results in session storage with key: ${resultsKey}`);
    } catch (e) {
      console.error('Error storing results in session storage:', e);
    }
    
    // Force a complete state reset before setting new results
    setVoiceSearchResults(null);
    
    // Use setTimeout to ensure the state has been cleared before setting new results
    setTimeout(() => {
      console.log('Setting voice search results with unique ID:', results.uniqueId);
      
      // IMPORTANT: First, ensure microphone is completely turned off before showing results
      // This guarantees the microphone is off before the modal appears
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onspeechend = null;
          recognitionRef.current.onnomatch = null;
          recognitionRef.current.onaudiostart = null;
          recognitionRef.current.onaudioend = null;
          recognitionRef.current.onsoundstart = null;
          recognitionRef.current.onsoundend = null;
          recognitionRef.current.onspeechstart = null;
          recognitionRef.current = null;
          console.log('Microphone completely turned off before showing results');
        } catch (e) {
          console.log('Error cleaning up recognition:', e);
        }
      }
      
      // Force microphone state to be off
      setIsListening(false);
      setIsButtonActive(false);
      
      // Add a refresh timestamp to force React to treat this as a completely new object
      // This is critical for ensuring the UI updates when only room quantity changes
      // Initialize early check-in and late check-out properties if not already present
      // This ensures these properties are always available for overnight stays
      const refreshedResults = {
        ...results,
        refreshTimestamp: Date.now(),
        forceRefresh: Math.random(), // Add random value to ensure state is always seen as different
        earlyCheckInHours: results.earlyCheckInHours || 0,
        lateCheckOutHours: results.lateCheckOutHours || 0,
        earlyCheckInCost: results.earlyCheckInCost || 0,
        lateCheckOutCost: results.lateCheckOutCost || 0
      };
      
      // Now show the results
      console.log('Setting voice search results with room quantity:', refreshedResults.roomQuantity);
      console.log('Full results object with refresh data:', JSON.stringify(refreshedResults, null, 2));
      
      // First completely hide the modal
      setShowVoiceSearchResults(false);
      
      // Then use a small timeout to ensure the UI has time to process the hide
      setTimeout(() => {
        // Set the results with the refresh data
        setVoiceSearchResults(refreshedResults);
        
        // If this is a valid room search result, add it to multiple room results
        if (refreshedResults.foundMatch) {
          // Create a display name for this room type including date information
          let roomDisplayName = `${refreshedResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : refreshedResults.bedType}${refreshedResults.hasJacuzzi ? ' with Jacuzzi' : ''}`;
          
          // Add date information if available
          if (refreshedResults.checkInDate && refreshedResults.checkOutDate) {
            // Format dates as short month/day for better readability
            const checkInStr = refreshedResults.checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const checkOutStr = refreshedResults.checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            roomDisplayName += ` (${checkInStr}-${checkOutStr})`;
          }
          
          // Add display name to the results
          const resultWithDisplayName = {
            ...refreshedResults,
            displayName: roomDisplayName
          };
          
          // Check if the current room type is already in the multiple room results
          setMultipleRoomResults(prevResults => {
            // Don't add duplicates of the same room type with same dates
            const isAlreadyAdded = prevResults.some(room => {
              // Compare room type and jacuzzi status
              const sameRoomType = room.bedType === refreshedResults.bedType && 
                                   room.hasJacuzzi === refreshedResults.hasJacuzzi;
              
              // Compare check-in and check-out dates
              // First, convert date objects to strings for comparison if they exist
              const roomCheckInStr = room.checkInDate ? room.checkInDate.toISOString() : null;
              const newCheckInStr = refreshedResults.checkInDate ? refreshedResults.checkInDate.toISOString() : null;
              const roomCheckOutStr = room.checkOutDate ? room.checkOutDate.toISOString() : null;
              const newCheckOutStr = refreshedResults.checkOutDate ? refreshedResults.checkOutDate.toISOString() : null;
              
              const sameDates = roomCheckInStr === newCheckInStr && roomCheckOutStr === newCheckOutStr;
              
              // Only consider it a duplicate if both room type and dates match
              return sameRoomType && sameDates;
            });
              
            if (!isAlreadyAdded) {
              console.log(`Adding ${roomDisplayName} to multiple room results`);
              // Add new room and set it as active
              const newResults = [...prevResults, resultWithDisplayName];
              setActiveRoomIndex(newResults.length - 1);
              return newResults;
            }
            return prevResults;
          });
        }
        
        // Apply the results to app state immediately
        applyVoiceSearchResults(refreshedResults);
        
        // Then show the modal with the updated results
        setShowVoiceSearchResults(true);
        console.log('Voice search results refreshed, applied to app state, and displayed');
      }, 50);
      
      // Reset button states
      setIsListening(false);
      setIsButtonActive(false);
      
      // Force a reflow for iOS
      setTimeout(() => {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 100);
    }, 50);
  };
  
  // Helper function to format time without seconds
  const formatTimeWithoutSeconds = (date) => {
    if (!date) return 'Not set';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };
  
  // Process short stay voice search
  const processShortStayVoiceSearch = (query, targetHour, searchId = null, explicitAM = false, explicitPM = false, forceJacuzzi = false, targetMinutes = null, isDuration = false, explicitDuration = null) => {
    console.log(`Processing short stay voice search: "${query}" with target hour ${targetHour}, AM: ${explicitAM}, PM: ${explicitPM}`);
    
    // Ensure microphone is completely turned off before showing results
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onnomatch = null;
        recognitionRef.current.onaudiostart = null;
        recognitionRef.current.onaudioend = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onsoundend = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current = null;
        console.log('Microphone completely turned off before showing short stay results');
      } catch (e) {
        console.log('Error cleaning up recognition:', e);
      }
    }
    
    // Convert query to lowercase for easier matching
    const shortStayQueryLower = query.toLowerCase();
    
    // Determine if the target hour is AM or PM
    let isPM = false;
    
    // If explicitly specified in the query, use that
    if (explicitPM) {
      isPM = true;
      console.log('PM explicitly specified in query');
    } else if (explicitAM) {
      isPM = false;
      console.log('AM explicitly specified in query');
    } else {
      // If not explicitly specified, use smart defaults
      // For short stay, assume PM for hours 1-11 (more common for short stays)
      isPM = (targetHour >= 1 && targetHour < 12);
      console.log(`No explicit AM/PM, assuming ${isPM ? 'PM' : 'AM'} for hour ${targetHour}`);
    }
    
    // Convert to 24-hour format
    if (isPM && targetHour < 12) {
      targetHour += 12;
    } else if (!isPM && targetHour === 12) {
      targetHour = 0;
    }
    
    console.log(`Target hour in 24-hour format: ${targetHour}:00`);
    
    // Always use the actual current time when the function is called
    const currentTime = new Date();
    console.log(`Current time: ${currentTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);    
    
    // Create checkout time based on target hour and minutes
    const checkoutTime = new Date(currentTime);
    
    // Use current time minutes if no specific minutes were provided in the query
    const minutesToUse = targetMinutes !== null ? targetMinutes : currentTime.getMinutes();
    
    console.log(`Setting checkout time to exactly ${targetHour}:${String(minutesToUse).padStart(2, '0')}`);
    // Set the hours and minutes, with seconds and milliseconds set to 0
    checkoutTime.setHours(targetHour, minutesToUse, 0, 0);
    
    // Skip date adjustments if this is a duration-based request (e.g., "7 hrs")
    if (!isDuration) {
      // Special handling for AM hours (3 AM, 4 AM, 5 AM, etc.)
      if (explicitAM) {
        // If AM is explicitly specified, ALWAYS set to next day
        // This ensures early morning hours like 5 AM are always for the next day
        console.log('EXPLICIT AM detected: ALWAYS setting checkout to next day');
        checkoutTime.setDate(checkoutTime.getDate() + 1);
      } else if (!isPM && currentTime.getHours() >= 12) {
        // If current time is PM and target is implicitly AM, set to next day
        console.log('IMPLICIT AM: Setting checkout to next day because current is PM and target is AM');
        checkoutTime.setDate(checkoutTime.getDate() + 1);
      } else if (checkoutTime <= currentTime) {
        // If checkout time is earlier than current time, assume next day
        console.log('Setting checkout to next day because checkout time is earlier than current time');
        checkoutTime.setDate(checkoutTime.getDate() + 1);
      }
    } else {
      console.log('Duration-based request: Skip adding extra days to checkout time');
      
      // Ensure checkout time is always consistent with explicit duration
      if (explicitDuration !== null) {
        // Recalculate checkout time to be exactly explicit duration from now
        // This handles any edge cases with larger hour values
        checkoutTime.setTime(currentTime.getTime() + (explicitDuration * 60 * 60 * 1000));
        console.log(`iOS Safari fix: Recalculated checkout time based on explicit duration: ${explicitDuration} hours`);
      }
    }
    
    // Log the AM/PM status for debugging
    console.log(`Checkout hour: ${targetHour}, isPM: ${isPM}, Final checkout time: ${checkoutTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);    
    console.log(`Checkout time in 12-hour format: ${checkoutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
    
    console.log(`Checkout time: ${checkoutTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`);    
    
    // Calculate duration in hours directly from current time to checkout time
    // We need to count the full hours, including the partial first hour
    
    // Calculate the raw duration in milliseconds
    const durationMs = checkoutTime - currentTime;
    
    // Get current minutes to check if we're between 45-60 minutes past the hour
    const currentMinutes = currentTime.getMinutes();
    console.log(`Current minutes: ${currentMinutes}`);
    
    // Use explicitDuration if provided, otherwise calculate from time difference
    let durationHours;
    
    if (explicitDuration !== null) {
      // Use the explicit duration provided in the voice command
      durationHours = explicitDuration;
      console.log(`Using explicit duration from voice command: ${durationHours} hours`);
    } else {
      // Calculate duration from time difference
      const rawHours = durationMs / (1000 * 60 * 60);
      
      // If current time is between 45-60 minutes past the hour, don't count the current hour
      if (currentMinutes >= 45 && currentMinutes < 60) {
        console.log('Current time is between 45-60 minutes past the hour, not counting this partial hour');
        // Subtract the remaining minutes in this hour from the duration
        const adjustedRawHours = rawHours - ((60 - currentMinutes) / 60);
        durationHours = Math.ceil(adjustedRawHours);
        console.log(`Adjusted raw hours: ${adjustedRawHours} hours`);
      } else {
        // For short stays, we always count a partial hour as a full hour
        durationHours = Math.ceil(rawHours);
      }
      
      console.log(`Raw hours calculation: ${rawHours} hours`);
      console.log(`Rounded to: ${durationHours} hours`);
      console.log(`From ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} to ${checkoutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
      
      // Special case: if we're at exactly X:00 and checking out at Y:00,
      // the hours should be Y-X (not counting the next day case)
      if (currentTime.getMinutes() === 0 && checkoutTime.getDate() === currentTime.getDate()) {
        const hourDiff = checkoutTime.getHours() - currentTime.getHours();
        if (hourDiff > 0) {
          console.log(`Exact hour difference: ${hourDiff} hours`);
          durationHours = hourDiff;
        }
      }
    }
    console.log(`Duration: ${durationHours} hours`);
    
    // Room type detection (reusing existing logic)
    let detectedBedType = 'Queen'; // Default
    
    // Check for King
    const kingIndicators = ['king', 'kings', 'keen', 'kin', 'kim', 'kingdom'];
    const queenIndicators = ['queen', 'queens', 'clean', 'cream', 'green'];
    
    let kingScore = 0;
    let queenScore = 0;
    
    kingIndicators.forEach(indicator => {
      const regex = new RegExp('\\b' + indicator + '\\b', 'gi');
      const matches = shortStayQueryLower.match(regex);
      if (matches) kingScore += matches.length;
    });
    
    queenIndicators.forEach(indicator => {
      const regex = new RegExp('\\b' + indicator + '\\b', 'gi');
      const matches = shortStayQueryLower.match(regex);
      if (matches) queenScore += matches.length;
    });
    
    if (kingScore > queenScore) {
      detectedBedType = 'King';
    } else if (queenScore > 0) {
      detectedBedType = 'Queen';
    }
    
    // Jacuzzi detection - use forceJacuzzi if provided, otherwise detect from query
    const shortStayHasJacuzzi = forceJacuzzi || ['jacuzzi', 'hot tub', 'spa', 'whirlpool', 'jet tub'].some(term => 
      shortStayQueryLower.includes(term)
    );
    
    console.log(`Jacuzzi detection: forceJacuzzi=${forceJacuzzi}, detected=${shortStayHasJacuzzi}`);
    
    // Calculate short stay price
    const shortStayBaseRate = shortStayHasJacuzzi 
      ? shortStayPrices.baseRate.withJacuzzi 
      : shortStayPrices.baseRate.withoutJacuzzi;
    
    // Calculate extra hours (beyond the base 4 hours)
    // For default short stay, we always use 4 hours as the base
    // For custom duration, we use the specified hours
    console.log(`Processing short stay with duration: ${durationHours} hours`);
    
    // Calculate extra hours (beyond the base 4 hours)
    const shortStayExtraHours = Math.max(0, durationHours - 4);
    const hourlyRate = shortStayPrices.extraHourRate.regular;
    const shortStayExtraHoursCost = shortStayExtraHours * hourlyRate;
    
    console.log(`Base rate: $${shortStayBaseRate}, Extra hours: ${shortStayExtraHours}, Extra cost: $${shortStayExtraHoursCost}`);
    
    
    // Calculate both cash and credit card prices
    // For cash - no tax
    const shortStayCashTotal = shortStayBaseRate + shortStayExtraHoursCost;
    
    // For credit card - 15% tax
    const shortStayCreditTaxAmount = (shortStayBaseRate + shortStayExtraHoursCost) * 0.15;
    const shortStayCreditTotal = shortStayBaseRate + shortStayExtraHoursCost + shortStayCreditTaxAmount;
    
    // Create results object
    // Instead of using Date objects for display times, create formatted time strings
    // This matches how the original pricecalculator project handles times
    
    // Format the check-in time as a string (hours:minutes AM/PM)
    const checkInHours = currentTime.getHours();
    const checkInMinutes = currentTime.getMinutes();
    const checkInAmPm = checkInHours >= 12 ? 'PM' : 'AM';
    const checkInDisplayHours = checkInHours % 12 || 12; // Convert 0 to 12 for 12 AM
    const checkInDisplayMinutes = String(checkInMinutes).padStart(2, '0');
    const formattedCheckInTime = `${checkInDisplayHours}:${checkInDisplayMinutes} ${checkInAmPm}`;
    
    // Format the check-out time as a string (hours:minutes AM/PM)
    const checkOutHours = checkoutTime.getHours();
    const checkOutMinutes = checkoutTime.getMinutes();
    const checkOutAmPm = checkOutHours >= 12 ? 'PM' : 'AM';
    const checkOutDisplayHours = checkOutHours % 12 || 12; // Convert 0 to 12 for 12 AM
    const checkOutDisplayMinutes = String(checkOutMinutes).padStart(2, '0');
    const formattedCheckOutTime = `${checkOutDisplayHours}:${checkOutDisplayMinutes} ${checkOutAmPm}`;
    
    console.log(`Formatted check-in time: ${formattedCheckInTime}`);
    console.log(`Formatted check-out time: ${formattedCheckOutTime}`);
    
    // Store the original Date objects for calculations and the formatted strings for display
    const results = {
      query: query,
      timestamp: Date.now(),
      searchId: searchId || `search-${Date.now()}`,
      roomQuantity: 1, // Default to 1 room
      // Store both the Date objects and formatted strings
      checkInDate: currentTime,
      checkOutDate: checkoutTime,
      // Add formatted time strings for display
      formattedCheckInTime: formattedCheckInTime,
      formattedCheckOutTime: formattedCheckOutTime,
      bedType: detectedBedType,
      hasJacuzzi: shortStayHasJacuzzi,
      isSmoking: false, // Default to non-smoking
      basePrice: shortStayBaseRate,
      extraHoursCost: shortStayExtraHoursCost,
      cashTotal: shortStayCashTotal,
      creditTax: shortStayCreditTaxAmount,
      creditTotal: shortStayCreditTotal,
      extraHours: shortStayExtraHours,
      isShortStay: true,
      foundMatch: true,
      nights: 0, // Short stay is not counted in nights
      uniqueId: `result-${Date.now()}-shortstay-${Math.random().toString(36).substring(2, 9)}`
    };
    
    // Store the results in session storage as a backup
    try {
      const resultsKey = `voice-results-${results.uniqueId}`;
      sessionStorage.setItem(resultsKey, JSON.stringify(results));
      console.log(`Stored short stay results in session storage with key: ${resultsKey}`);
    } catch (e) {
      console.error('Error storing short stay results in session storage:', e);
    }
    
    // Force a complete state reset before setting new results
    setVoiceSearchResults(null);
    
    // Use setTimeout to ensure the state has been cleared before setting new results
    setTimeout(() => {
      console.log('Setting voice search results for short stay');
      
      // Ensure microphone is completely turned off before showing results
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onspeechend = null;
          recognitionRef.current.onnomatch = null;
          recognitionRef.current.onaudiostart = null;
          recognitionRef.current.onaudioend = null;
          recognitionRef.current.onsoundstart = null;
          recognitionRef.current.onsoundend = null;
          recognitionRef.current.onspeechstart = null;
          recognitionRef.current = null;
          console.log('Microphone completely turned off before showing short stay results');
        } catch (e) {
          console.log('Error cleaning up recognition:', e);
        }
      }
      
      // Force microphone state to be off
      setIsListening(false);
      setIsButtonActive(false);
      
      // Add a refresh timestamp to force React to treat this as a completely new object
      const refreshedResults = {
        ...results,
        refreshTimestamp: Date.now(),
        forceRefresh: Math.random()
      };
      
      // First completely hide the modal
      setShowVoiceSearchResults(false);
      
      // Then use a small timeout to ensure the UI has time to process the hide
      setTimeout(() => {
        // Set the results with the refresh data
        setVoiceSearchResults(refreshedResults);
        
        // Apply the results to app state immediately
        applyVoiceSearchResults(refreshedResults);
        
        // Then show the modal with the updated results
        setShowVoiceSearchResults(true);
        console.log('Short stay voice search results refreshed, applied to app state, and displayed');
      }, 50);
      
      // Reset button states
      setIsListening(false);
      setIsButtonActive(false);
      
      // Force a reflow for iOS
      setTimeout(() => {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 100);
    }, 50);
  };
  
  // Apply voice search results to the app state
  const applyVoiceSearchResults = (results) => {
    console.log('Applying voice search results to app state:', results);
    if (!results) return;
    
    // Store the results in session storage as a backup
    try {
      sessionStorage.setItem('lastVoiceSearchResults', JSON.stringify(results));
    } catch (e) {
      console.error('Error saving voice search results to session storage:', e);
    }
    
    // If this is a short stay, apply short stay specific logic
    if (results.isShortStay) {
      // Set short stay specific state
      if (results.hasJacuzzi !== undefined) setHasJacuzzi(results.hasJacuzzi);
      if (results.extraHours !== undefined) setExtraHours(results.extraHours);
      if (results.basePrice !== undefined) setBasePrice(results.basePrice);
      if (results.extraHoursCost !== undefined) setExtraHoursCost(results.extraHoursCost);
      if (results.tax !== undefined) setTaxAmount(results.tax);
      if (results.total !== undefined) setTotalPrice(results.total);
      if (results.paymentMethod !== undefined) setPaymentMethod(results.paymentMethod);
      
      // Switch to short stay tab if needed
      if (activeTab !== 'short') {
        setActiveTab('short');
      }
    } else {
      // For regular overnight stays
      // Update check-in and check-out dates if provided
      if (results.checkInDate) setCheckInDate(new Date(results.checkInDate));
      if (results.checkOutDate) setCheckOutDate(new Date(results.checkOutDate));
      
      // Switch to overnight tab if needed
      if (activeTab !== 'overnight') {
        setActiveTab('overnight');
      }
    }
  };
  
  // Handle touch start for dragging
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const buttonElement = e.currentTarget;
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Calculate the offset from the touch point to the button's top-left corner
    const offsetX = touch.clientX - buttonRect.left;
    const offsetY = touch.clientY - buttonRect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    
    // Prevent default to avoid scrolling while dragging
    e.preventDefault();
  };
  
  // Handle touch move for dragging
  const handleTouchMove = (e) => {
    if (isDragging) {
      const touch = e.touches[0];
      
      // Calculate new position based on touch position and drag offset
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      
      // Apply constraints to keep button within viewport
      const buttonWidth = 80; // Approximate width of the button
      const buttonHeight = 80; // Approximate height of the button
      
      const maxX = window.innerWidth - buttonWidth;
      const maxY = window.innerHeight - buttonHeight;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      setButtonPosition({ x: constrainedX, y: constrainedY });
      
      // Prevent default to avoid scrolling while dragging
      e.preventDefault();
    }
  };
  
  // Handle touch end for dragging
  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  // Handle voice button click
  const handleVoiceButtonClick = (e) => {
    // Only handle click if not dragging
    if (!isDragging) {
      e.preventDefault();
      console.log('Voice button clicked');
      
      // If we're already listening, stop
      if (isListening) {
        console.log('Stopping active recognition');
        stopVoiceRecognition();
        return;
      }
      
      // Clear previously saved rooms when starting a new search
      // This ensures we have a clean slate for the new search
      setMultipleRoomResults([]);
      setActiveRoomIndex(-1);
      
      // Start voice recognition
      setIsButtonActive(true);
      startImprovedVoiceRecognition();
    }
  };
  
  // Helper to reliably stop voice recognition
  const stopVoiceRecognition = () => {
    console.log('Force stopping voice recognition');
    if (recognitionRef.current) {
      try {
        // Remove all event handlers first
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onaudiostart = null;
        recognitionRef.current.onaudioend = null;
        recognitionRef.current.onsoundstart = null;
        recognitionRef.current.onsoundend = null;
        
        // Then stop the recognition
        recognitionRef.current.stop();
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
    
    // Reset UI state regardless of errors
    setIsListening(false);
    setIsButtonActive(false);
  };
  
  // Update room quantity in voice search results and recalculate prices
  const updateVoiceSearchRoomQuantity = (quantity) => {
    console.log(`updateVoiceSearchRoomQuantity called with quantity=${quantity}`);
    
    // Ensure quantity is a valid number
    quantity = parseInt(quantity) || 1;
    
    // Validate the quantity (1-5 rooms allowed)
    if (quantity < 1) {
      quantity = 1;
    } else if (quantity > 5) {
      quantity = 5;
    }
    
    console.log(`Setting room quantity to ${quantity}`);
    
    try {
      // Create a copy of the current results using spread operator to preserve Date objects
      const updatedResults = { ...voiceSearchResults };
      
      // Update the room quantity
      updatedResults.roomQuantity = quantity;
      
      // Make sure all required properties exist to avoid undefined errors
      if (!updatedResults.singleRoomPrice) {
        updatedResults.singleRoomPrice = updatedResults.price / (updatedResults.roomQuantity || 1);
      }
      
      // Calculate new price based on quantity
      updatedResults.price = updatedResults.singleRoomPrice * quantity;
      
      // Calculate tax (15%)
      updatedResults.tax = updatedResults.price * 0.15;
      
      // Make sure these properties exist
      if (typeof updatedResults.earlyCheckInCost === 'undefined') {
        updatedResults.earlyCheckInCost = 0;
      }
      
      if (typeof updatedResults.lateCheckOutCost === 'undefined') {
        updatedResults.lateCheckOutCost = 0;
      }
      
      // Update total price
      updatedResults.total = updatedResults.price + updatedResults.tax + 
                           updatedResults.earlyCheckInCost + 
                           updatedResults.lateCheckOutCost;
      
      // Update cash total if it exists
      if (typeof updatedResults.cashTotal !== 'undefined') {
        updatedResults.cashTotal = updatedResults.total;
      }
      
      // Update credit card totals if they exist
      if (typeof updatedResults.creditTax !== 'undefined') {
        updatedResults.creditTax = updatedResults.total * 0.15;
        updatedResults.creditTotal = updatedResults.total + updatedResults.creditTax;
      }
      
      // Ensure all values are numbers to avoid toFixed errors
      updatedResults.price = Number(updatedResults.price) || 0;
      updatedResults.tax = Number(updatedResults.tax) || 0;
      updatedResults.total = Number(updatedResults.total) || 0;
      
      console.log(`Room quantity updated: ${quantity}, new price: $${updatedResults.price.toFixed(2)}, new total: $${updatedResults.total.toFixed(2)}`);
      
      // Force a complete refresh
      updatedResults.refreshTimestamp = Date.now();
      updatedResults.forceRefresh = Math.random();
      
      // Update the state with the new results
      setVoiceSearchResults(updatedResults);
    } catch (error) {
      console.error('Error updating room quantity:', error);
    }
  };
  
  // Update early check-in hours in voice search results and recalculate prices
  const updateVoiceSearchEarlyCheckIn = (hours) => {
    console.log(`updateVoiceSearchEarlyCheckIn called with hours=${hours}`);
    
    try {
      // Ensure hours is a valid number
      hours = parseInt(hours) || 0;
      
      // Validate the hours (0-9 hours allowed to enable check-in as early as 6:00 AM)
      if (hours < 0) {
        hours = 0;
      } else if (hours > 9) {
        hours = 9;
      }
      
      console.log(`Setting early check-in hours to ${hours}`);
      
      // Create a copy of the current results using spread operator to preserve Date objects
      const updatedResults = { ...voiceSearchResults };
      
      // Update the early check-in hours
      updatedResults.earlyCheckInHours = hours;
      
      // Calculate cost: $15 per hour
      const hourlyRate = 15;
      updatedResults.earlyCheckInCost = hours * hourlyRate;
      
      // Make sure all required properties exist
      if (typeof updatedResults.price === 'undefined' || isNaN(updatedResults.price)) {
        updatedResults.price = 0;
      }
      
      if (typeof updatedResults.tax === 'undefined' || isNaN(updatedResults.tax)) {
        updatedResults.tax = 0;
      }
      
      if (typeof updatedResults.lateCheckOutCost === 'undefined' || isNaN(updatedResults.lateCheckOutCost)) {
        updatedResults.lateCheckOutCost = 0;
      }
      
      // Update total price
      updatedResults.total = updatedResults.price + updatedResults.tax + 
                            updatedResults.earlyCheckInCost + 
                            updatedResults.lateCheckOutCost;
      
      // Ensure all values are numbers to avoid toFixed errors
      updatedResults.earlyCheckInCost = Number(updatedResults.earlyCheckInCost) || 0;
      updatedResults.total = Number(updatedResults.total) || 0;
      
      console.log(`Early check-in updated: ${hours} hours, cost: $${updatedResults.earlyCheckInCost.toFixed(2)}, new total: $${updatedResults.total.toFixed(2)}`);
      
      // Force a complete refresh
      updatedResults.refreshTimestamp = Date.now();
      updatedResults.forceRefresh = Math.random();
      
      // Update the state with the new results
      setVoiceSearchResults(updatedResults);
    } catch (error) {
      console.error('Error updating early check-in hours:', error);
    }
  };
  
  // Update late check-out hours in voice search results and recalculate prices
  const updateVoiceSearchLateCheckOut = (hours) => {
    console.log(`updateVoiceSearchLateCheckOut called with hours=${hours}`);
    
    try {
      // Ensure hours is a valid number
      hours = parseInt(hours) || 0;
      
      // Validate the hours (0-12 hours allowed)
      if (hours < 0) {
        hours = 0;
      } else if (hours > 12) {
        hours = 12;
      }
      
      console.log(`Setting late check-out hours to ${hours}`);
      
      // Create a copy of the current results using spread operator to preserve Date objects
      const updatedResults = { ...voiceSearchResults };
      
      // Update the late check-out hours
      updatedResults.lateCheckOutHours = hours;
      
      // Calculate cost: $15 per hour
      const hourlyRate = 15;
      updatedResults.lateCheckOutCost = hours * hourlyRate;
      
      // Make sure all required properties exist
      if (typeof updatedResults.price === 'undefined' || isNaN(updatedResults.price)) {
        updatedResults.price = 0;
      }
      
      if (typeof updatedResults.tax === 'undefined' || isNaN(updatedResults.tax)) {
        updatedResults.tax = 0;
      }
      
      if (typeof updatedResults.earlyCheckInCost === 'undefined' || isNaN(updatedResults.earlyCheckInCost)) {
        updatedResults.earlyCheckInCost = 0;
      }
      
      // Update total price
      updatedResults.total = updatedResults.price + updatedResults.tax + 
                            updatedResults.earlyCheckInCost + 
                            updatedResults.lateCheckOutCost;
      
      // Ensure all values are numbers to avoid toFixed errors
      updatedResults.lateCheckOutCost = Number(updatedResults.lateCheckOutCost) || 0;
      updatedResults.total = Number(updatedResults.total) || 0;
      
      console.log(`Late check-out updated: ${hours} hours, cost: $${updatedResults.lateCheckOutCost.toFixed(2)}, new total: $${updatedResults.total.toFixed(2)}`);
      
      // Force a complete refresh
      updatedResults.refreshTimestamp = Date.now();
      updatedResults.forceRefresh = Math.random();
      
      // Update the state with the new results
      setVoiceSearchResults(updatedResults);
    } catch (error) {
      console.error('Error updating late check-out hours:', error);
    }
  };
  
  // Close voice search results
  const closeVoiceSearchResults = () => {
    console.log('Closing voice search results modal');
    
    // Apply the current voice search results to the app state before closing
    if (voiceSearchResults) {
      applyVoiceSearchResults(voiceSearchResults);
    }
    
    // Hide the modal
    setShowVoiceSearchResults(false);
    
    // Note: We're NOT clearing multipleRoomResults here to preserve room data
    // We only hide the modal but keep the room data for when we reopen
    
    // If there are multiple rooms saved, we keep the current voiceSearchResults
    // otherwise, we clear it as before
    setTimeout(() => {
      // Only clear voice search results if we don't have any saved rooms
      if (multipleRoomResults.length === 0) {
        setVoiceSearchResults(null);
      }
    }, 300);
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // For iOS devices, add extra cleanup
    if (isIOS) {
      // Force a reflow for iOS
      setTimeout(() => {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
      }, 100);
    }
  };
  
  // Handle card mouse move
  const handleCardMouseMove = (e) => {
    if (hoveredCard) {
      // Get the viewport width to adjust tooltip position
      const viewportWidth = window.innerWidth;
      const tooltipWidth = 110; // Width of our tooltip
      const cursorX = e.clientX;
      
      // Adjust x position if tooltip would go off screen on the right
      let adjustedX = cursorX;
      if (cursorX + tooltipWidth > viewportWidth) {
        adjustedX = cursorX - tooltipWidth;
      }
      
      setMousePos({ x: adjustedX, y: e.clientY });
    }
  };
  
  // Handle room removal from the SelectedRooms component
  const handleRemoveRoom = (roomId) => {
    setSelectedRooms(selectedRooms.filter(room => room.id !== roomId));
  };
  
  // Handle clearing all booked rooms at once
  const handleClearBookedRooms = () => {
    // Filter out all booked rooms from selectedRooms
    setSelectedRooms(selectedRooms.filter(room => !bookedRooms.includes(room.number)));
  };
  
  // Toggle room selector modal
  const toggleRoomSelector = () => {
    setShowRoomSelector(!showRoomSelector);
  };
  
  // Save current stay
  const saveCurrentStay = () => {
    // Create a new stay object based on which tab is active
    let newStay;
    
    if (activeTab === 'short') {
      newStay = {
        checkInDate: new Date().toISOString(),
        checkOutDate: new Date(new Date().getTime() + ((4 + extraHours) * 60 * 60 * 1000)).toISOString(),
        nights: 0, // Short stay is not counted in nights
        bedType,
        hasJacuzzi,
        isSmoking,
        totalPrice,
        basePrice,
        taxAmount,
        extraHoursCost,
        extraHours,
        paymentMethod,
        isShortStay: true
      };
      
      // Reset short stay price summary visibility
      setShowShortStayPriceSummary(false);
      
    } else {
      newStay = {
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        nights: overnightPriceInfo.nights,
        bedType: overnightBedType,
        hasJacuzzi: hasJacuzziOvernight,
        isSmoking: overnightSmoking,
        totalPrice: overnightPriceInfo.totalPrice,
        basePrice: overnightPriceInfo.totalBasePrice,
        taxAmount: overnightPriceInfo.taxAmount,
        paymentMethod: overnightPayment,
        extraHoursCheckIn: Math.abs(overnightExtraHours),
        extraHoursCheckOut: overnightCheckoutExtraHours,
        extraHoursCheckInCost: overnightPriceInfo.extraHoursCheckInCost,
        extraHoursCheckOutCost: overnightPriceInfo.extraHoursCheckOutCost,
        hourlyRate: overnightRateType === 'regular' ? shortStayPrices.extraHourRate.regular : shortStayPrices.extraHourRate.discounted,
        dailyPrices: overnightPriceInfo.dailyPrices,
        isShortStay: false
      };
      
      // Reset overnight price summary visibility
      setShowOvernightPriceSummary(false);
    }
    
    // Add to saved stays
    setSavedStays([...savedStays, newStay]);
    
    // No confirmation popup
  };
  
  // Remove a saved stay
  const removeSavedStay = (index) => {
    const updatedStays = [...savedStays];
    updatedStays.splice(index, 1);
    setSavedStays(updatedStays);
  };
  
  return (
    <div className="iphone-container">
      {/* Top bar with date and price */}
      <div className="iphone-top-bar">
        <div className="date-time">
          <span className="day" style={dayStyle}>{currentDay}</span>
          <span className="date">{currentDate}</span>
        </div>
        
        <div className="daily-price">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            {/* Regular Room Price Format */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span style={{fontSize: '7px', fontWeight: 'bold', marginBottom: '2px'}}>Regular Room</span>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{fontSize: '10px', fontWeight: 'bold'}}>${dailyPrices.regular}</span>
                <span style={{fontSize: '8px', margin: '0 1px'}}>+</span>
                <span style={{fontSize: '9px'}}><span style={{fontSize: '7px', marginRight: '1px'}}>Tax</span>${(dailyPrices.regular * 0.15).toFixed(0)}</span>
                <span style={{fontSize: '8px', margin: '0 1px'}}>=</span>
                <span style={{fontSize: '10px', fontWeight: 'bold', color: '#FFA500'}}>${Math.round(dailyPrices.regular * 1.15)}</span>
              </div>
            </div>
            
            <span style={{margin: '0 5px', fontSize: '10px'}}> </span>
            
            {/* Jacuzzi Room Price Format */}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <span style={{fontSize: '8px', fontWeight: 'bold', marginBottom: '2px'}}>Jacuzzi</span>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{fontSize: '10px', fontWeight: 'bold'}}>${dailyPrices.jacuzzi}</span>
                <span style={{fontSize: '8px', margin: '0 1px'}}>+</span>
                <span style={{fontSize: '9px'}}><span style={{fontSize: '7px', marginRight: '1px'}}>Tax</span>${(dailyPrices.jacuzzi * 0.15).toFixed(0)}</span>
                <span style={{fontSize: '8px', margin: '0 1px'}}>=</span>
                <span style={{fontSize: '10px', fontWeight: 'bold', color: '#FFA500'}}>${Math.round(dailyPrices.jacuzzi * 1.15)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Button container for select rooms and clear */}
      <div className="top-buttons-container">
        <button className="select-rooms-top-button" onClick={toggleRoomSelector}>
          {selectedRooms.length > 0 ? `Selected Rooms (${selectedRooms.length})` : 'Select Rooms'}
        </button>
        <button 
          className="small-clear-button" 
          onClick={clearAllRooms}
          style={{ backgroundColor: 'red', color: 'white' }}
        >
          Clear
        </button>
      </div>
      
      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'short' ? 'active' : ''}`}
          onClick={() => setActiveTab('short')}
        >
          Short Stay
        </button>
        <button 
          className={`tab ${activeTab === 'overnight' ? 'active' : ''}`}
          onClick={() => setActiveTab('overnight')}
        >
          Multiple Nights
        </button>
        <button 
          className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content" data-tab={activeTab}>
        
        {/* Selected Rooms Component - Only show in short stay tab */}
        {activeTab === 'short' && selectedRooms.length > 0 && (
          <SelectedRooms 
            selectedRooms={selectedRooms} 
            bookedRooms={bookedRooms}
            onRemoveRoom={handleRemoveRoom}
            onClearBookedRooms={handleClearBookedRooms}
          />
        )}
        
        {/* Rooms Tab Content */}
        {activeTab === 'rooms' && (
          <div className="rooms-tab-content">
            <div className="floor-tabs">
              <button 
                className={`floor-tab ${activeFloor === 'ground' ? 'active' : ''}`}
                onClick={() => setActiveFloor('ground')}
              >
                First Floor
              </button>
              <button 
                className={`floor-tab ${activeFloor === 'first' ? 'active' : ''}`}
                onClick={() => setActiveFloor('first')}
              >
                Second Floor
              </button>
            </div>
            
            <div className="all-rooms-container">
              {availableRooms
                .filter(room => room.floor === (activeFloor === 'ground' ? 'ground' : 'first'))
                .map(room => (
                  <div 
                    key={room.id}
                    className={`room-card-container ${bookedRooms.includes(room.number) ? 'booked-container' : ''}`}
                    style={bookedRooms.includes(room.number) ? {backgroundColor: '#00A651'} : {}}
                    onMouseEnter={(e) => handleCardMouseEnter(room, e)}
                    onMouseLeave={handleCardMouseLeave}
                    onMouseMove={handleCardMouseMove}
                  >
                    <div 
                      className={`room-card ${room.bedType === 'Queen' ? 'queen' : 
                                 room.bedType === 'King' ? 'king' : 'queen-2-beds'} 
                                 ${room.isSmoking ? 'smoking' : ''} 
                                 ${room.hasJacuzzi ? 'jacuzzi' : ''}
                                 ${bookedRooms.includes(room.number) ? 'booked' : ''}`}
                      style={bookedRooms.includes(room.number) ? {backgroundColor: '#00A651', borderRadius: '14px', border: 'none'} : {}}
                    >
                      {/* BOOKING label removed */}
                      <span className="room-number">{room.number}</span>
                      <span className="room-type">
                        {room.bedType === 'Queen' ? 'Queen' : 
                         room.bedType === 'King' ? 'King' : 'Queen 2 Beds'}
                      </span>
                      <div className="room-features">
                        {room.hasJacuzzi && <span className="feature jacuzzi">Jacuzzi</span>}
                        <span className="feature smoking-status">
                          {room.isSmoking ? 'Smoking' : 'Non-Smoking'}
                        </span>
                        <span className="feature capacity">
                          {room.bedType === 'Queen' && '👤👤'}
                          {room.bedType === 'King' && '👤👤👤'}
                          {room.bedType === 'Queen2Beds' && '👤👤👤👤'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
        
        {/* Room Selector Modal */}
        {showRoomSelector && (
          <div className="room-selector-modal">
            <div className="room-selector-content">
              <div className="room-selector-header">
                <h3>Select Rooms</h3>
                <button className="close-button" onClick={toggleRoomSelector}>×</button>
              </div>
              
              <div className="floor-tabs">
                <button 
                  className={`floor-tab ${activeFloor === 'ground' ? 'active' : ''}`}
                  onClick={() => setActiveFloor('ground')}
                >
                  First Floor
                </button>
                <button 
                  className={`floor-tab ${activeFloor === 'first' ? 'active' : ''}`}
                  onClick={() => setActiveFloor('first')}
                >
                  Second Floor
                </button>
              </div>
              
              <div className={`available-rooms-grid ${activeFloor === 'first' ? 'first-floor-active' : ''}`}>
                {availableRooms
                  .filter(room => room.floor === 'ground')
                  .map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                                       room.bedType === 'King' ? 'king' : 'queen-2-beds';
                    const isBooked = bookedRooms.includes(room.number);
                    const classes = `room-selector-card ${bedTypeClass} ${room.isSmoking ? 'smoking' : ''} ${room.hasJacuzzi ? 'jacuzzi' : ''} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`;
                    
                    return (
                      <div 
                        key={room.id} 
                        className={classes}
                        style={isBooked ? {backgroundColor: '#00A651', borderRadius: '14px', border: 'none'} : {}}
                        onClick={() => handleRoomSelect(room)}
                      >
                        {isBooked && <span className="booked-label">BOOKING</span>}
                        <span className="room-number">{room.number}</span>
                        <span className="room-type">
                          {room.bedType === 'Queen' ? 'Queen' : 
                           room.bedType === 'King' ? 'King' : 'Queen 2B'}
                        </span>
                        {room.hasJacuzzi && <div className="multiple-label">Multiple</div>}
                        {isSelected && <div className="selected-checkmark">✓</div>}
                      </div>
                    );
                  })}
                  
                {/* Second Floor Rooms - Initially hidden via CSS */}
                {availableRooms
                  .filter(room => room.floor === 'first')
                  .map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                                       room.bedType === 'King' ? 'king' : 'queen-2-beds';
                    const isBooked = bookedRooms.includes(room.number);
                    const classes = `room-selector-card first-floor ${bedTypeClass} ${room.isSmoking ? 'smoking' : ''} ${room.hasJacuzzi ? 'jacuzzi' : ''} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`;
                    
                    return (
                      <div 
                        key={room.id} 
                        className={classes}
                        style={isBooked ? {backgroundColor: '#00A651', borderRadius: '14px', border: 'none'} : {}}
                        onClick={() => handleRoomSelect(room)}
                      >
                        {isBooked && <span className="booked-label">BOOKING</span>}
                        <span className="room-number">{room.number}</span>
                        <span className="room-type">
                          {room.bedType === 'Queen' ? 'Queen' : 
                           room.bedType === 'King' ? 'King' : 'Queen 2B'}
                        </span>
                        {room.hasJacuzzi && <div className="multiple-label">Multiple</div>}
                        {isSelected && <div className="selected-checkmark">✓</div>}
                      </div>
                    );
                  })}
              </div>
              <div className="room-selector-footer">
                <button className="done-button" onClick={toggleRoomSelector}>Done</button>
              </div>
            </div>
          </div>
        )}

        
        {/* Short Stay Tab Content */}
        {activeTab === 'short' && (
          <div className="short-stay-section">
            <div className="short-stay-card-layout">
              {/* Main options card */}
              <div className="short-stay-main-card">
                {/* Top row with Jacuzzi and Payment Method */}
                <div className="short-stay-row">
                  <div className="short-stay-option">
                    <label><i className="fas fa-hot-tub" style={{"marginRight": "8px"}}></i>Jacuzzi</label>
                    <div className="toggle-buttons">
                      <button 
                        className={!hasJacuzzi ? 'active' : ''}
                        onClick={() => setHasJacuzzi(false)}
                      >
                        No
                      </button>
                      <button 
                        className={hasJacuzzi ? 'active' : ''}
                        onClick={() => setHasJacuzzi(true)}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                  <div className="short-stay-option">
                    <label><i className="fas fa-credit-card" style={{"marginRight": "8px"}}></i>Payment</label>
                    <div className="toggle-buttons">
                      <button 
                        className={paymentMethod === 'cash' ? 'active' : ''}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        Cash
                      </button>
                      <button 
                        className={paymentMethod === 'credit' ? 'active' : ''}
                        onClick={() => setPaymentMethod('credit')}
                      >
                        Card
                      </button>
                    </div>
                  </div>
                </div>

                {/* Time display */}
                <div className="short-stay-time-section">
                  <div className="time-row">
                    <span className="time-label">Check-in:</span>
                    <span className="time-value">{currentTime}</span>
                  </div>
                  <div className="time-row">
                    <span className="time-label">Check-out:</span>
                    <span className="time-value">{checkoutTime}</span>
                  </div>
                </div>
                
                {/* Bottom row with Extra Hours and Rate */}
                <div className="short-stay-row">
                  <div className="short-stay-option">
                    <label>Extra Hours</label>
                    <div className="counter-control">
                      <button className="minus-button" onClick={() => handleExtraHoursChange(-1)}>-</button>
                      <span>{extraHours}</span>
                      <button className="plus-button" onClick={() => handleExtraHoursChange(1)}>+</button>
                    </div>
                    <div className="extra-hours-display">
                      <div className="extra-hours-label">
                        {extraHours > 0 ? `4+${extraHours} extra hours` : '4 hours'}
                      </div>
                      <div className="total-hours-display">
                        Total: {4 + extraHours}hr
                      </div>
                    </div>
                  </div>
                  <div className="short-stay-option">
                    <label>Hour Rate</label>
                    <div className="toggle-buttons">
                      <button 
                        className={extraHourRate === 15 ? 'active' : ''}
                        onClick={() => setExtraHourRate(15)}
                      >
                        $15
                      </button>
                      <button 
                        className={extraHourRate === 10 ? 'active' : ''}
                        onClick={() => setExtraHourRate(10)}
                      >
                        $10
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Price summary card - always visible */}
              <div className="price-summary-card">
                <div className="price-summary">
                  <div className="price-row">
                    <span>Base Price:</span>
                    <span>${basePrice.toFixed(2)}</span>
                  </div>
                  {extraHours > 0 && (
                    <div className="price-row">
                      <span>Extra ({extraHours}h):</span>
                      <span>${(extraHours * extraHourRate).toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="price-row">
                      <span>Tax (15%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="price-row total">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Pricing Grid Table */}
              <div className="pricing-grid-container">
                <table className="pricing-grid-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th colSpan="2" className="jacuzzi-header">No Jacuzzi</th>
                      <th colSpan="2" className="jacuzzi-header">Jacuzzi</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th>Cash</th>
                      <th>Credit card</th>
                      <th>Cash</th>
                      <th>Credit card</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="hours-column">4 hrs</td>
                      <td>$60</td>
                      <td>$69</td>
                      <td>$90</td>
                      <td>$104</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+1 (5 hrs)</td>
                      <td>$75</td>
                      <td>$87</td>
                      <td>$105</td>
                      <td>$121</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+2 (6 hrs)</td>
                      <td>$90</td>
                      <td>$104</td>
                      <td>$120</td>
                      <td>$138</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+3 (7 hrs)</td>
                      <td>$105</td>
                      <td>$121</td>
                      <td>$135</td>
                      <td>$156</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+4 (8 hrs)</td>
                      <td>$120</td>
                      <td>$138</td>
                      <td>$150</td>
                      <td>$173</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+5 (9 hrs)</td>
                      <td>$135</td>
                      <td>$156</td>
                      <td>$165</td>
                      <td>$190</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+6 (10 hrs)</td>
                      <td>$150</td>
                      <td>$173</td>
                      <td>$180</td>
                      <td>$207</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+7 (11 hrs)</td>
                      <td>$165</td>
                      <td>$190</td>
                      <td>$195</td>
                      <td>$225</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+8 (12 hrs)</td>
                      <td>$180</td>
                      <td>$207</td>
                      <td>$210</td>
                      <td>$242</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+9 (13 hrs)</td>
                      <td>$195</td>
                      <td>$225</td>
                      <td>$225</td>
                      <td>$259</td>
                    </tr>
                    <tr>
                      <td className="hours-column">4+10 (14 hrs)</td>
                      <td>$210</td>
                      <td>$242</td>
                      <td>$240</td>
                      <td>$276</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Overnight Stay Tab Content */}
        {activeTab === 'overnight' && (
          <div className="multi-night-section">
            <div className="date-pickers">
              <div className="date-picker-container">
                <span>Check-in Date</span>
                <DatePicker
                  selected={checkInDate}
                  onChange={handleCheckInChange}
                  dateFormat="MMMM d, yyyy"
                  className="date-picker"
                />
              </div>
              <div className="date-picker-container">
                <span>Check-out Date</span>
                <DatePicker
                  selected={checkOutDate}
                  onChange={handleCheckOutChange}
                  dateFormat="MMMM d, yyyy"
                  className="date-picker"
                  minDate={new Date(checkInDate.getTime() + (24 * 60 * 60 * 1000))}
                />
              </div>
            </div>
            
            <div className="option-group">
              <label>Room Type</label>
              <div className="toggle-buttons bed-type">
                <button 
                  className={overnightBedType === 'Queen' ? 'active' : ''}
                  onClick={() => setOvernightBedType('Queen')}
                >
                  Queen
                </button>
                <button 
                  className={overnightBedType === 'King' ? 'active' : ''}
                  onClick={() => setOvernightBedType('King')}
                >
                  King
                </button>
                {!hasJacuzziOvernight && (
                  <button 
                    className={overnightBedType === 'Queen2Beds' ? 'active' : ''}
                    onClick={() => setOvernightBedType('Queen2Beds')}
                  >
                    Queen 2 Beds
                  </button>
                )}
              </div>
            </div>
            
            <div className="option-group">
              <label><i className="fas fa-hot-tub" style={{"marginRight": "8px"}}></i>Jacuzzi</label>
              <div className="toggle-buttons">
                <button 
                  className={!hasJacuzziOvernight ? 'active' : ''}
                  onClick={() => setHasJacuzziOvernight(false)}
                >
                  No
                </button>
                <button 
                  className={hasJacuzziOvernight ? 'active' : ''}
                  onClick={() => setHasJacuzziOvernight(true)}
                >
                  Yes
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Smoking</label>
              <div className="toggle-buttons">
                <button 
                  className={!overnightSmoking ? 'active' : ''}
                  onClick={() => setOvernightSmoking(false)}
                >
                  Non-Smoking
                </button>
                <button 
                  className={overnightSmoking ? 'active' : ''}
                  onClick={() => setOvernightSmoking(true)}
                >
                  Smoking
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label><i className="fas fa-credit-card" style={{"marginRight": "8px"}}></i>Payment Method</label>
              <div className="toggle-buttons">
                <button 
                  className={overnightPayment === 'cash' ? 'active' : ''}
                  onClick={() => setOvernightPayment('cash')}
                >
                  Cash
                </button>
                <button 
                  className={overnightPayment === 'credit' ? 'active' : ''}
                  onClick={() => setOvernightPayment('credit')}
                >
                  Credit Card
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <div className="centered-label">Early Check-in Hours</div>
              <div className="counter-control">
                <button 
                  className="minus-button" 
                  onClick={() => handleOvernightExtraHoursChange(-1)}
                >
                  -
                </button>
                <span>{Math.abs(overnightExtraHours)}</span>
                <button 
                  className="plus-button" 
                  onClick={() => handleOvernightExtraHoursChange(1)}
                >
                  +
                </button>
              </div>
              <div className="time-label">
                Check-in @ {calculateCheckInTime(overnightExtraHours)}
              </div>
            </div>
            
            <div className="option-group">
              <div className="centered-label">Late Check-out Hours</div>
              <div className="counter-control">
                <button 
                  className="minus-button" 
                  onClick={() => {
                    // Ensure hours don't go below 0
                    const newValue = Math.max(0, overnightCheckoutExtraHours - 1);
                    // Update the time display and recalculate price
                    updateLateCheckOutTime(newValue);
                    // Force recalculation of price
                    calculateOvernightPrice();
                  }}
                >
                  -
                </button>
                <span>{overnightCheckoutExtraHours}</span>
                <button 
                  className="plus-button" 
                  onClick={() => {
                    // Update the time display and recalculate price
                    updateLateCheckOutTime(overnightCheckoutExtraHours + 1);
                    // Force recalculation of price
                    calculateOvernightPrice();
                  }}
                >
                  +
                </button>
              </div>
              <div className="time-label">
                Check-out @ {calculateCheckOutTime(overnightCheckoutExtraHours)}
              </div>
            </div>
            
            <div className="option-group">
              <label>Extra Hour Rate</label>
              <div className="toggle-buttons">
                <button 
                  className={overnightRateType === 'regular' ? 'active' : ''}
                  onClick={() => setOvernightRateType('regular')}
                >
                  Regular ($15)
                </button>
                <button 
                  className={overnightRateType === 'discounted' ? 'active' : ''}
                  onClick={() => setOvernightRateType('discounted')}
                >
                  Discounted ($10)
                </button>
              </div>
            </div>
            
            {showOvernightPriceSummary && (
              <div className="price-summary">
                <div className="price-row">
                  <span>Base Price ({overnightPriceInfo.nights} nights):</span>
                  <span>${overnightPriceInfo.totalBasePrice?.toFixed(2)}</span>
                </div>
                
                {/* Daily price breakdown */}
                <div className="daily-price-breakdown">
                  <div className="breakdown-header">Daily Price Breakdown:</div>
                  {overnightPriceInfo.dailyPrices?.map((day, index) => (
                    <div key={index} className="price-row daily-price">
                      <span>{day.dayOfWeek}, {day.date}:</span>
                      <span>${day.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {overnightPriceInfo.taxAmount > 0 && (
                  <div className="price-row">
                    <span>Tax (15% on room + extra hrs):</span>
                    <span>${overnightPriceInfo.taxAmount?.toFixed(2)}</span>
                  </div>
                )}
                {overnightPriceInfo.extraHoursCheckInCost > 0 && (
                  <div className="price-row">
                    <span>Early Check-in (<span style={{color: '#FFA500'}}>{Math.abs(overnightExtraHours)} hrs</span> @ {overnightRateType === 'regular' ? '$15' : '$10'}/hr):</span>
                    <span style={{color: '#FFA500'}}>${overnightPriceInfo.extraHoursCheckInCost?.toFixed(2)}</span>
                  </div>
                )}
                {overnightPriceInfo.extraHoursCheckOutCost > 0 && (
                  <div className="price-row">
                    <span>Late Check-out (<span style={{color: '#FFA500'}}>{overnightCheckoutExtraHours} hrs</span> @ {overnightRateType === 'regular' ? '$15' : '$10'}/hr):</span>
                    <span style={{color: '#FFA500'}}>${overnightPriceInfo.extraHoursCheckOutCost?.toFixed(2)}</span>
                  </div>
                )}

                <div className="price-row total">
                  <span>Total:</span>
                  <span>${overnightPriceInfo.totalPrice?.toFixed(2)}</span>
                </div>
                
                <button 
                  className="remove-price-button"
                  onClick={() => setShowOvernightPriceSummary(false)}
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Saved Stays Section */}
            {savedStays.length > 0 && (
              <div className="saved-stays-section">
                <h3>Saved Stays</h3>
                {savedStays.map((stay, index) => (
                  <div key={index} className="saved-stay-item">
                    <div className="saved-stay-content">
                      <button 
                        className="remove-stay-button"
                        onClick={() => removeSavedStay(index)}
                      >
                        ×
                      </button>
                      
                      <div className="saved-stay-header">
                        <div className="saved-stay-dates">
                          <span>{new Date(stay.checkInDate).toLocaleDateString()}</span>
                          <span className="date-separator">→</span>
                          <span>{new Date(stay.checkOutDate).toLocaleDateString()}</span>
                        </div>
                        <div className="saved-stay-info">
                          <span>{stay.nights} nights</span>
                          <span>•</span>
                          <span>{stay.bedType}</span>
                          <span>•</span>
                          <span>{stay.hasJacuzzi ? 'Jacuzzi' : 'No Jacuzzi'}</span>
                        </div>
                      </div>
                      
                      <div className="saved-stay-price-container">
                        {/* Daily price breakdown for saved stays */}
                        {!stay.isShortStay && stay.dailyPrices && stay.dailyPrices.length > 0 && (
                          <div className="daily-price-breakdown">
                            <div className="breakdown-header">Daily Price Breakdown:</div>
                            {stay.dailyPrices.map((day, dayIndex) => (
                              <div key={dayIndex} className="price-row daily-price">
                                <span>{day.dayOfWeek}, {day.date}:</span>
                                <span>${day.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="price-row">
                          <span>Tax (15%):</span>
                          <span>${stay.taxAmount.toFixed(2)}</span>
                        </div>
                        {stay.extraHours > 0 && (
                          <div className="price-row">
                            <span>Extra Hours ({stay.extraHours} × ${stay.hourlyRate || 15}):</span>
                            <span>${stay.extraHoursCost?.toFixed(2) || (stay.extraHours * (stay.hourlyRate || 15)).toFixed(2)}</span>
                          </div>
                        )}
                        {stay.extraHoursCheckIn > 0 && (
                          <div className="price-row">
                            <span>Early Check-in ({stay.extraHoursCheckIn} hrs @ ${stay.hourlyRate || 15}/hr):</span>
                            <span>${stay.extraHoursCheckInCost?.toFixed(2)}</span>
                          </div>
                        )}
                        {stay.extraHoursCheckOut > 0 && (
                          <div className="price-row">
                            <span>Late Check-out ({stay.extraHoursCheckOut} hrs @ ${stay.hourlyRate || 15}/hr):</span>
                            <span>${stay.extraHoursCheckOutCost?.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="price-row-divider"></div>
                        <div className="price-row total">
                          <span>Total:</span>
                          <span>${stay.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Global tooltip that follows the mouse */}
      {hoveredCard && (
        <div 
          className="price-tooltip" 
          style={{
            position: 'fixed',
            top: mousePos.y - 100,
            left: mousePos.x,
            transform: 'none',
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'none',
            zIndex: 10000,
            width: '110px',
            fontSize: '10px'
          }}
        >
          <div className="price-row">
            <span>Base:</span>
            <span>${hoveredCard.basePrice.toFixed(2)}</span>
          </div>
          <div className="price-row">
            <span>Tax:</span>
            <span>${hoveredCard.tax.toFixed(2)}</span>
          </div>
          <div className="price-row total">
            <span>Total:</span>
            <span>${hoveredCard.total.toFixed(2)}</span>
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
      
      {/* Guided Voice Search Modal */}
      {guidedVoiceSearch.active && (
        <div className="guided-voice-modal">
          <div className="guided-voice-container">
            <div className="guided-voice-header">
              <h3>Voice Search Assistant</h3>
              <button onClick={closeGuidedVoiceSearch}>×</button>
            </div>
            
            <div className="guided-voice-content">
              {/* Progress Indicator */}
              <div className="guided-voice-progress">
                <div className={`guided-voice-progress-dot ${guidedVoiceSearch.step >= 1 ? 'active' : ''} ${guidedVoiceSearch.step > 1 ? 'completed' : ''}`}></div>
                <div className={`guided-voice-progress-dot ${guidedVoiceSearch.step >= 2 ? 'active' : ''} ${guidedVoiceSearch.step > 2 ? 'completed' : ''}`}></div>
                <div className={`guided-voice-progress-dot ${guidedVoiceSearch.step >= 3 ? 'active' : ''} ${guidedVoiceSearch.step > 3 ? 'completed' : ''}`}></div>
              </div>
              
              {/* Step 1: Room Type */}
              {guidedVoiceSearch.step === 1 && (
                <div className="guided-voice-step">
                  <div className="guided-voice-watermark">Room Type</div>
                  <div className="guided-voice-value">{guidedVoiceSearch.roomType || 'Listening...'}</div>
                  <div className="guided-voice-instructions">
                    Press the microphone button and say "Smoking" or "Non-Smoking"
                  </div>
                  <button 
                    className={`guided-voice-mic-button ${isButtonActive ? 'active' : ''}`}
                    onTouchStart={handleGuidedVoiceStep}
                    onMouseDown={handleGuidedVoiceStep}
                    onTouchEnd={() => recognitionRef.current && recognitionRef.current.stop()}
                    onMouseUp={() => recognitionRef.current && recognitionRef.current.stop()}
                  >
                    <i className={`fas ${isButtonActive ? 'fa-microphone-alt' : 'fa-microphone'}`}></i>
                  </button>
                </div>
              )}
              
              {/* Step 2: Bed Type */}
              {guidedVoiceSearch.step === 2 && (
                <div className="guided-voice-step">
                  <div className="guided-voice-watermark">Bed Type</div>
                  <div className="guided-voice-value">
                    {guidedVoiceSearch.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : guidedVoiceSearch.bedType || 'Listening...'}
                  </div>
                  <div className="guided-voice-instructions">
                    Press the microphone button and say "Queen", "King", or "Double"
                  </div>
                  <button 
                    className={`guided-voice-mic-button ${isButtonActive ? 'active' : ''}`}
                    onTouchStart={handleGuidedVoiceStep}
                    onMouseDown={handleGuidedVoiceStep}
                    onTouchEnd={() => recognitionRef.current && recognitionRef.current.stop()}
                    onMouseUp={() => recognitionRef.current && recognitionRef.current.stop()}
                  >
                    <i className={`fas ${isButtonActive ? 'fa-microphone-alt' : 'fa-microphone'}`}></i>
                  </button>
                </div>
              )}
              
              {/* Step 3: Stay Duration */}
              {guidedVoiceSearch.step === 3 && (
                <div className="guided-voice-step">
                  <div className="guided-voice-watermark">Stay Duration</div>
                  <div className="guided-voice-value">{guidedVoiceSearch.stayDuration || 'Listening...'}</div>
                  <div className="guided-voice-instructions">
                    Press the microphone button and say "Tonight", "Weekend", or specific dates
                  </div>
                  <button 
                    className={`guided-voice-mic-button ${isButtonActive ? 'active' : ''}`}
                    onTouchStart={handleGuidedVoiceStep}
                    onMouseDown={handleGuidedVoiceStep}
                    onTouchEnd={() => recognitionRef.current && recognitionRef.current.stop()}
                    onMouseUp={() => recognitionRef.current && recognitionRef.current.stop()}
                  >
                    <i className={`fas ${isButtonActive ? 'fa-microphone-alt' : 'fa-microphone'}`}></i>
                  </button>
                </div>
              )}
              
              {/* Step 4: Processing */}
              {guidedVoiceSearch.step === 4 && (
                <div className="guided-voice-step">
                  <div className="guided-voice-watermark">Processing Your Request</div>
                  <div className="guided-voice-value">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
                  <div className="guided-voice-instructions">
                    Finding the perfect room for you...
                  </div>
                </div>
              )}
            </div>
            
            <div className="guided-voice-footer">
              {guidedVoiceSearch.step < 4 && (
                <>
                  <button className="guided-voice-skip-button" onClick={skipGuidedStep}>
                    Skip
                  </button>
                  {guidedVoiceSearch.step === 3 && guidedVoiceSearch.roomType && guidedVoiceSearch.bedType && (
                    <button className="guided-voice-next-button" onClick={processCompleteGuidedSearch}>
                      Search
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Search Results Popup - Simplified for iOS compatibility */}
      {showVoiceSearchResults && voiceSearchResults && (
        <div className="voice-search-results" id="voiceSearchResults">
          <div className="voice-search-header">
            <h3>Voice Search Results</h3>
            <button onClick={closeVoiceSearchResults} className="close-button">×</button>
          </div>
          
          <div className="voice-search-content" id="voiceSearchContent">
            {voiceSearchResults.recognitionError ? (
              <div className="recognition-error">
                <p><i className="fas fa-exclamation-circle"></i></p>
                <p><strong>Speech recognition error</strong></p>
                <p>There was a problem with the speech recognition service. Please try again.</p>
              </div>
            ) : voiceSearchResults.noSpeechDetected ? (
              <div className="no-speech-error">
                <p><i className="fas fa-microphone-slash" style={{fontSize: '32px', color: '#ff6b6b'}}></i></p>
                <p style={{fontSize: '16px', fontWeight: 'bold', margin: '10px 0'}}>No speech detected</p>
                <button 
                  onClick={() => {
                    closeVoiceSearchResults();
                    setTimeout(() => {
                      startImprovedVoiceRecognition();
                    }, 300);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '6px 14px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : voiceSearchResults.foundMatch ? (
              <div>
                {/* Show error message for invalid room types */}
                {voiceSearchResults.invalidRoomType && (
                  <div className="room-type-error">
                    <p><strong>Sorry!</strong> We don't have {voiceSearchResults.requestedInvalidType} rooms available.</p>
                    <p>Available room types:</p>
                    <ul>
                      {Object.entries(voiceSearchResults.validRoomTypes).map(([key, description]) => (
                        <li key={key}><strong>{key === 'Queen2Beds' ? 'Queen 2 Beds' : key}:</strong> {description}</li>
                      ))}
                    </ul>
                    <p>We've selected a {voiceSearchResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : voiceSearchResults.bedType} room for your stay.</p>
                  </div>
                )}
                
                {/* Show error message for invalid room combinations */}
                {voiceSearchResults.invalidCombination && (
                  <div className="room-type-error">
                    <p><strong>Sorry!</strong> We don't have {voiceSearchResults.requestedInvalidCombination} rooms available.</p>
                    <p>Available room combinations with Jacuzzi:</p>
                    <ul>
                      {Object.entries(voiceSearchResults.validCombinations)
                        .filter(([key, isValid]) => isValid && key.includes('Jacuzzi'))
                        .map(([key]) => {
                          const roomType = key.split('-')[0];
                          return (
                            <li key={key}>
                              <strong>{roomType === 'Queen2Beds' ? 'Queen 2 Beds' : roomType} with Jacuzzi</strong>
                            </li>
                          );
                        })}
                    </ul>
                    <p>We've selected a {voiceSearchResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : voiceSearchResults.bedType} room with Jacuzzi for your stay.</p>
                  </div>
                )}
                
                {/* Room selector UI - only show when we have multiple rooms */}
                {multipleRoomResults.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', marginBottom: '5px' }}>Select room to view:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {multipleRoomResults.map((room, index) => (
                        <button 
                          key={`room-${index}`}
                          onClick={() => {
                            // Set the active room index and update the current results
                            setActiveRoomIndex(index);
                            setVoiceSearchResults(multipleRoomResults[index]);
                          }}
                          style={{
                            backgroundColor: '#3f51b5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '5px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            opacity: activeRoomIndex === index ? 1 : 0.8,
                            position: 'relative'
                          }}
                        >
                          <span>{room.displayName}</span>
                          <span 
                            style={{
                              marginLeft: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: '#ff0000',
                              position: 'relative',
                              top: '-1px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the main button click
                              const updatedRooms = [...multipleRoomResults];
                              updatedRooms.splice(index, 1);
                              setMultipleRoomResults(updatedRooms);
                              // If we're removing the active room, reset the active index
                              if (index === activeRoomIndex) {
                                setActiveRoomIndex(updatedRooms.length > 0 ? 0 : -1);
                                setVoiceSearchResults(updatedRooms.length > 0 ? updatedRooms[0] : null);
                              } else if (index < activeRoomIndex) {
                                // Adjust the active index if we're removing a room before it
                                setActiveRoomIndex(activeRoomIndex - 1);
                              }
                            }}
                          >
                            ×
                          </span>
                        </button>
                      ))}
                      {voiceSearchResults && !multipleRoomResults.some(room => 
                        room.bedType === voiceSearchResults.bedType && 
                        room.hasJacuzzi === voiceSearchResults.hasJacuzzi
                      ) && (
                        <button 
                          onClick={() => {
                            // Save current results if not already in the list
                            if (voiceSearchResults && voiceSearchResults.foundMatch) {
                              const roomWithName = {
                                ...voiceSearchResults,
                                displayName: `${voiceSearchResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : voiceSearchResults.bedType}${voiceSearchResults.hasJacuzzi ? ' with Jacuzzi' : ''}`
                              };
                              const newResults = [...multipleRoomResults, roomWithName];
                              setMultipleRoomResults(newResults);
                              setActiveRoomIndex(newResults.length - 1);
                            }
                          }}
                          style={{
                            backgroundColor: '#3f51b5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '5px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            opacity: 0.9
                          }}
                        >
                          Current Room
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px' }}>Stay Details:</strong>
                    {/* Add room button inline with Stay Details (only for overnight stays) */}
                    {!voiceSearchResults.isShortStay && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Add room button clicked - saving current results and activating voice recognition');
                          
                          // Save the current search results to multipleRoomResults if it's not already there
                          if (voiceSearchResults && voiceSearchResults.foundMatch) {
                            setMultipleRoomResults(prevResults => {
                              // Check if this room is already in the results
                              const isAlreadyAdded = prevResults.some(room => 
                                room.bedType === voiceSearchResults.bedType && 
                                room.hasJacuzzi === voiceSearchResults.hasJacuzzi);
                                
                              if (!isAlreadyAdded) {
                                console.log('Adding current room to multiple results');
                                // Create a copy with a friendly name for display
                                const roomWithName = {
                                  ...voiceSearchResults,
                                  displayName: `${voiceSearchResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : voiceSearchResults.bedType}${voiceSearchResults.hasJacuzzi ? ' with Jacuzzi' : ''}`
                                };
                                return [...prevResults, roomWithName];
                              }
                              return prevResults;
                            });
                          }
                          
                          // Keep the modal visible and activate the voice button
                          setIsButtonActive(true);
                          
                          // Toggle the listening state manually
                          if (recognitionRef.current) {
                            try {
                              recognitionRef.current.abort();
                            } catch (err) {
                              console.log('Error stopping existing recognition:', err);
                            }
                          }
                          
                          // Start a new voice recognition session
                          startImprovedVoiceRecognition();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#3f51b5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'normal'
                        }}
                      >
                        <span style={{ marginRight: '2px', fontSize: '12px' }}>+</span>
                        Add room
                      </button>
                    )}
                  </div>
                  <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '12px' }}>
                    <li>Check-in: {voiceSearchResults.isShortStay && voiceSearchResults.formattedCheckInTime ? 
                      voiceSearchResults.formattedCheckInTime : 
                      (voiceSearchResults.checkInDate ? 
                        <>
                          {voiceSearchResults.checkInDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          {voiceSearchResults.earlyCheckInHours !== 0 ? (
                            <span style={{ fontSize: '10px', marginLeft: '4px', color: '#dc3545', fontWeight: 'bold' }}>
                              {(() => {
                                // Standard check-in is 3:00 PM (15:00 in 24-hour format)
                                // Allow early check-in as early as 6:00 AM (9 hours before 3:00 PM)
                                // When earlyCheckInHours is 1, time should be 2:00 PM
                                // When earlyCheckInHours is 9, time should be 6:00 AM
                                const hour = 15 - voiceSearchResults.earlyCheckInHours;
                                if (hour <= 0) {
                                  // Handle hours before noon
                                  const adjustedHour = (hour + 12) % 12 || 12;
                                  return `(${adjustedHour}:00 AM)`;
                                } else if (hour < 12) {
                                  // Handle hours before noon
                                  return `(${hour}:00 AM)`;
                                } else if (hour === 12) {
                                  // Noon
                                  return `(12:00 PM)`;
                                } else {
                                  // Afternoon hours
                                  return `(${hour - 12}:00 PM)`;
                                }
                              })()}
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', marginLeft: '4px', color: '#666' }}>(3:00 PM)</span>
                          )}
                        </> : 'Not set')}</li>
                    <li>Check-out: {voiceSearchResults.isShortStay && voiceSearchResults.formattedCheckOutTime ? 
                      voiceSearchResults.formattedCheckOutTime : 
                      (voiceSearchResults.checkOutDate ? 
                        <>
                          {voiceSearchResults.checkOutDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          {voiceSearchResults.lateCheckOutHours > 0 ? (
                            <span style={{ fontSize: '10px', marginLeft: '4px', color: '#dc3545', fontWeight: 'bold' }}>
                              {(() => {
                                // Get exact minutes from the checkOutDate if available
                                const minutes = voiceSearchResults.checkOutDate ? 
                                  String(voiceSearchResults.checkOutDate.getMinutes()).padStart(2, '0') : '00';
                                
                                const hour = 11 + voiceSearchResults.lateCheckOutHours;
                                if (hour < 12) {
                                  // Morning hours
                                  return `(${hour}:${minutes} AM)`;
                                } else if (hour === 12) {
                                  // Noon
                                  return `(12:${minutes} PM)`;
                                } else {
                                  // Afternoon hours
                                  return `(${hour - 12}:${minutes} PM)`;
                                }
                              })()}
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', marginLeft: '4px', color: '#666' }}>(11:00 AM)</span>
                          )}
                        </> : 'Not set')}</li>
                    {voiceSearchResults.isShortStay ? (
                      <>
                        <li>Duration: {4 + voiceSearchResults.extraHours} hours {voiceSearchResults.extraHours > 0 ? `(Base: 4 hours + ${voiceSearchResults.extraHours} extra)` : ''}</li>
                        {voiceSearchResults.query.toLowerCase().includes('jacuzzi') || 
                         voiceSearchResults.query.toLowerCase().includes('hot tub') || 
                         voiceSearchResults.query.toLowerCase().includes('spa') ? (
                          <li>{voiceSearchResults.hasJacuzzi ? 'With Jacuzzi' : 'No Jacuzzi'}</li>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <li>Nights: {voiceSearchResults.nights}</li>
                        <li>Room Type: {voiceSearchResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : voiceSearchResults.bedType}</li>
                        {/* Only show jacuzzi label if it was mentioned in the search query */}
                        {voiceSearchResults.query.toLowerCase().includes('jacuzzi') || 
                         voiceSearchResults.query.toLowerCase().includes('hot tub') || 
                         voiceSearchResults.query.toLowerCase().includes('spa') ? (
                          <li>{voiceSearchResults.hasJacuzzi ? 'With Jacuzzi' : 'No Jacuzzi'}</li>
                        ) : null}
                        <li>{voiceSearchResults.isSmoking ? 'Smoking' : 'Non-Smoking'}</li>
                        {/* Room Quantity - Only show for overnight stays */}
                        <li className="room-quantity">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Room Quantity:</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Room quantity minus button clicked');
                                  
                                  if (voiceSearchResults && voiceSearchResults.roomQuantity > 1) {
                                    // Direct state update with simple calculation
                                    const newQuantity = voiceSearchResults.roomQuantity - 1;
                                    
                                    // Create a simple copy with only the necessary updates
                                    const updatedResults = { ...voiceSearchResults };
                                    updatedResults.roomQuantity = newQuantity;
                                    
                                    if (updatedResults.isShortStay) {
                                      // For short stay bookings
                                      // Store single room values if not already stored
                                      if (!updatedResults.singleBasePrice) {
                                        updatedResults.singleBasePrice = Number(updatedResults.basePrice) || 0;
                                      }
                                      if (!updatedResults.singleExtraHoursCost) {
                                        updatedResults.singleExtraHoursCost = Number(updatedResults.extraHoursCost) || 0;
                                      }
                                      
                                      // Update all price fields for short stay
                                      updatedResults.basePrice = Number(updatedResults.singleBasePrice) * newQuantity;
                                      updatedResults.extraHoursCost = Number(updatedResults.singleExtraHoursCost) * newQuantity;
                                      updatedResults.cashTotal = updatedResults.basePrice + updatedResults.extraHoursCost;
                                      updatedResults.creditTax = updatedResults.cashTotal * 0.15;
                                      updatedResults.creditTotal = updatedResults.cashTotal + updatedResults.creditTax;
                                      updatedResults.total = updatedResults.cashTotal;
                                    } else {
                                      // For overnight stays
                                      // Simple price calculation
                                      if (updatedResults.singleRoomPrice) {
                                        updatedResults.price = Number(updatedResults.singleRoomPrice) * newQuantity;
                                        updatedResults.tax = Number(updatedResults.price) * 0.15;
                                        updatedResults.total = Number(updatedResults.price) + 
                                                             Number(updatedResults.tax) + 
                                                             Number(updatedResults.earlyCheckInCost || 0) + 
                                                             Number(updatedResults.lateCheckOutCost || 0);
                                      }
                                    }
                                    
                                    // Force refresh
                                    updatedResults.refreshTimestamp = Date.now();
                                    
                                    // Update state directly
                                    setVoiceSearchResults(updatedResults);
                                    console.log('Decreased room quantity to:', newQuantity);
                                  }
                                }}
                                disabled={voiceSearchResults.roomQuantity <= 1}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  marginRight: '6px',
                                  cursor: voiceSearchResults.roomQuantity <= 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                              >
                                -
                              </button>
                              <span style={{ margin: '0 8px'}}>{voiceSearchResults.roomQuantity} {voiceSearchResults.roomQuantity === 1 ? 'room' : 'rooms'}</span>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Room quantity plus button clicked');
                                  
                                  if (voiceSearchResults && voiceSearchResults.roomQuantity < 10) {
                                    // Direct state update with simple calculation
                                    const newQuantity = voiceSearchResults.roomQuantity + 1;
                                    
                                    // Create a simple copy with only the necessary updates
                                    const updatedResults = { ...voiceSearchResults };
                                    updatedResults.roomQuantity = newQuantity;
                                    
                                    if (updatedResults.isShortStay) {
                                      // For short stay bookings
                                      // Store single room values if not already stored
                                      if (!updatedResults.singleBasePrice) {
                                        updatedResults.singleBasePrice = Number(updatedResults.basePrice) || 0;
                                      }
                                      if (!updatedResults.singleExtraHoursCost) {
                                        updatedResults.singleExtraHoursCost = Number(updatedResults.extraHoursCost) || 0;
                                      }
                                      
                                      // Update all price fields for short stay
                                      updatedResults.basePrice = Number(updatedResults.singleBasePrice) * newQuantity;
                                      updatedResults.extraHoursCost = Number(updatedResults.singleExtraHoursCost) * newQuantity;
                                      updatedResults.cashTotal = updatedResults.basePrice + updatedResults.extraHoursCost;
                                      updatedResults.creditTax = updatedResults.cashTotal * 0.15;
                                      updatedResults.creditTotal = updatedResults.cashTotal + updatedResults.creditTax;
                                      updatedResults.total = updatedResults.cashTotal;
                                    } else {
                                      // For overnight stays
                                      // Simple price calculation
                                      if (updatedResults.singleRoomPrice) {
                                        updatedResults.price = Number(updatedResults.singleRoomPrice) * newQuantity;
                                        updatedResults.tax = Number(updatedResults.price) * 0.15;
                                        updatedResults.total = Number(updatedResults.price) + 
                                                             Number(updatedResults.tax) + 
                                                             Number(updatedResults.earlyCheckInCost || 0) + 
                                                             Number(updatedResults.lateCheckOutCost || 0);
                                      }
                                    }
                                    
                                    // Force refresh
                                    updatedResults.refreshTimestamp = Date.now();
                                    
                                    // Update state directly
                                    setVoiceSearchResults(updatedResults);
                                    console.log('Increased room quantity to:', newQuantity);
                                  }
                                }}
                                disabled={voiceSearchResults.roomQuantity >= 5}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: voiceSearchResults.roomQuantity >= 5 ? '#ccc' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  marginLeft: '6px',
                                  cursor: voiceSearchResults.roomQuantity >= 5 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                        </li>
                        {/* Early Check-in - Only show for overnight stays */}
                        <li className="early-checkin">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Early Check-in:</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Early check-in minus button clicked');
                                  
                                  // Direct state update with simple calculation
                                  const currentHours = parseInt(voiceSearchResults.earlyCheckInHours) || 0;
                                  // Always allow increasing hours with maximum of 9 (to get to 6:00 AM)
                                  // Standard check-in is 3:00 PM (15:00), so 9 hours earlier is 6:00 AM
                                  const newHours = Math.min(currentHours + 1, 9); // Increase hours to make check-in earlier
                                  
                                  // Create a simple copy with only the necessary updates
                                  const updatedResults = { ...voiceSearchResults };
                                  updatedResults.earlyCheckInHours = newHours;
                                  
                                  // Calculate cost based on actual hours
                                  updatedResults.earlyCheckInCost = Number(newHours * 15);
                                  
                                  // Make sure all values are numbers
                                  const price = Number(updatedResults.price || 0);
                                  const tax = Number(updatedResults.tax || 0);
                                  const lateCheckOutCost = Number(updatedResults.lateCheckOutCost || 0);
                                  
                                  // Update total
                                  updatedResults.total = price + tax + updatedResults.earlyCheckInCost + lateCheckOutCost;
                                  
                                  // Force refresh
                                  updatedResults.refreshTimestamp = Date.now();
                                  
                                  // Update state directly
                                  console.log('Decreasing early check-in to', newHours, 'hours');
                                  setVoiceSearchResults(updatedResults);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  marginRight: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                              >
                                -
                              </button>
                              <span style={{ margin: '0 8px'}}>{voiceSearchResults.earlyCheckInHours} {voiceSearchResults.earlyCheckInHours === 1 ? 'hour' : 'hours'}</span>
                              <button 
                                disabled={true}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#ccc',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  marginLeft: '6px',
                                  cursor: 'not-allowed',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  opacity: 0.6
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                        </li>
                        
                        {/* Late Check-out - Only show for overnight stays */}
                        <li className="late-checkout">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Late Check-out:</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Late check-out minus button clicked');
                                  
                                  // Direct state update with simple calculation
                                  const currentHours = parseInt(voiceSearchResults.lateCheckOutHours) || 0;
                                  if (currentHours > 0) {
                                    const newHours = currentHours - 1;
                                    
                                    // Create a simple copy with only the necessary updates
                                    const updatedResults = { ...voiceSearchResults };
                                    updatedResults.lateCheckOutHours = newHours;
                                    
                                    // Simple cost calculation
                                    updatedResults.lateCheckOutCost = Number(newHours * 15);
                                    
                                    // Make sure all values are numbers
                                    const price = Number(updatedResults.price || 0);
                                    const tax = Number(updatedResults.tax || 0);
                                    const earlyCheckInCost = Number(updatedResults.earlyCheckInCost || 0);
                                    
                                    // Update total
                                    updatedResults.total = price + tax + earlyCheckInCost + updatedResults.lateCheckOutCost;
                                    
                                    // Force refresh
                                    updatedResults.refreshTimestamp = Date.now();
                                    updatedResults.forceRefresh = Math.random();
                                    
                                    // Update state directly
                                    console.log('Decreasing late check-out to', newHours, 'hours');
                                    setVoiceSearchResults(updatedResults);
                                  }
                                }}
                                disabled={voiceSearchResults.lateCheckOutHours <= 0}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: voiceSearchResults.lateCheckOutHours <= 0 ? '#ccc' : '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  marginRight: '6px',
                                  cursor: voiceSearchResults.lateCheckOutHours <= 0 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                              >
                                -
                              </button>
                              <span style={{ margin: '0 8px'}}>{voiceSearchResults.lateCheckOutHours} {voiceSearchResults.lateCheckOutHours === 1 ? 'hour' : 'hours'}</span>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Late check-out plus button clicked');
                                  
                                  // Direct state update with simple calculation
                                  const currentHours = parseInt(voiceSearchResults.lateCheckOutHours) || 0;
                                  if (currentHours < 12) {
                                    const newHours = currentHours + 1;
                                    
                                    // Create a simple copy with only the necessary updates
                                    const updatedResults = { ...voiceSearchResults };
                                    updatedResults.lateCheckOutHours = newHours;
                                    
                                    // Simple cost calculation
                                    updatedResults.lateCheckOutCost = Number(newHours * 15);
                                    
                                    // Make sure all values are numbers
                                    const price = Number(updatedResults.price || 0);
                                    const tax = Number(updatedResults.tax || 0);
                                    const earlyCheckInCost = Number(updatedResults.earlyCheckInCost || 0);
                                    
                                    // Update total
                                    updatedResults.total = price + tax + earlyCheckInCost + updatedResults.lateCheckOutCost;
                                    
                                    // Force refresh
                                    updatedResults.refreshTimestamp = Date.now();
                                    updatedResults.forceRefresh = Math.random();
                                    
                                    // Update state directly
                                    console.log('Increasing late check-out to', newHours, 'hours');
                                    setVoiceSearchResults(updatedResults);
                                  }
                                }}
                                disabled={voiceSearchResults.lateCheckOutHours >= 12}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: voiceSearchResults.lateCheckOutHours >= 12 ? '#ccc' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  marginLeft: '6px',
                                  cursor: voiceSearchResults.lateCheckOutHours >= 12 ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                        </li>


                      </>
                    )}
                  </ul>
                </div>
                
                <div className="voice-search-price-card" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  borderRadius: '8px', 
                  marginTop: '12px',
                  fontSize: '14px'
                }}>
                  {/* Daily price breakdown - only show if more than 1 night */}
                  {voiceSearchResults.dailyPrices && voiceSearchResults.dailyPrices.length > 1 && (
                    <div className="daily-price-breakdown">
                      <div className="breakdown-header" style={{ fontSize: '12px' }}>Daily Price Breakdown (per room):</div>
                      {voiceSearchResults.dailyPrices.map((day, index) => (
                        <div key={index} className="daily-price">
                          <span style={{ fontSize: '11px' }}>{day.dayOfWeek}, {day.date}</span>
                          <span style={{ fontSize: '11px' }}>${day.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show single room price if multiple rooms */}
                  {voiceSearchResults.isShortStay ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85em' }}>
                        <span style={{ fontSize: '11px' }}>Base Rate (4 hours{voiceSearchResults.hasJacuzzi ? ' with Jacuzzi' : ''}):</span>
                        <span style={{ fontSize: '11px' }}>${(Number(voiceSearchResults.basePrice) || 0).toFixed(2)}</span>
                      </div>
                      {voiceSearchResults.extraHours > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85em' }}>
                          <span style={{ fontSize: '11px' }}>Extra Hours ({voiceSearchResults.extraHours} @ ${(Number(shortStayPrices?.extraHourRate?.regular) || 0).toFixed(2)}/hr):</span>
                          <span style={{ fontSize: '11px' }}>${(Number(voiceSearchResults.extraHoursCost) || 0).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Cash price */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginTop: '12px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '11px' }}>Cash Price:</span>
                        <span style={{ fontSize: '11px' }}>${(Number(voiceSearchResults.cashTotal) || 0).toFixed(2)}</span>
                      </div>
                      
                      {/* Credit card price with tax */}
                      <div style={{ marginTop: '10px', backgroundColor: 'rgba(0,0,255,0.1)', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85em' }}>
                          <span style={{ fontSize: '11px' }}>Credit Card Tax (15%):</span> 
                          <span style={{ fontSize: '11px' }}>${(Number(voiceSearchResults.creditTax) || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9em' }}>
                          <span style={{ fontSize: '11px' }}>Credit Card Total:</span>
                          <span style={{ fontSize: '11px' }}>${(Number(voiceSearchResults.creditTotal) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : voiceSearchResults.roomQuantity > 1 ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Price per room:</span>
                        <span>${(Number(voiceSearchResults.singleRoomPrice) || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span>Number of rooms:</span>
                        <span>{voiceSearchResults.roomQuantity}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Total base price:</span>
                        <span>${(Number(voiceSearchResults.price) || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Tax (15%):</span>
                        <span>${(Number(voiceSearchResults.tax) || 0).toFixed(2)}</span>
                      </div>
                      
                      {/* Show early check-in cost if applicable */}
                      {voiceSearchResults.earlyCheckInHours !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Early Check-in ({voiceSearchResults.earlyCheckInHours} {voiceSearchResults.earlyCheckInHours === 1 ? 'hour' : 'hours'} @ $15/hr):</span>
                          <span>${voiceSearchResults.earlyCheckInCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Show late check-out cost if applicable */}
                      {voiceSearchResults.lateCheckOutHours > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Late Check-out ({voiceSearchResults.lateCheckOutHours} {voiceSearchResults.lateCheckOutHours === 1 ? 'hour' : 'hours'} @ $15/hr):</span>
                          <span>${voiceSearchResults.lateCheckOutCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginTop: '12px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                        fontSize: '16px',
                        alignItems: 'center'
                      }}>
                        <span>Total:</span>
                        <span>${(Number(voiceSearchResults.total) || 0).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span>Base Price:</span>
                        <span>${(Number(voiceSearchResults.price) || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Tax (15%):</span>
                        <span>${(Number(voiceSearchResults.tax) || 0).toFixed(2)}</span>
                      </div>
                      
                      {/* Show early check-in cost if applicable */}
                      {voiceSearchResults.earlyCheckInHours !== 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Early Check-in ({voiceSearchResults.earlyCheckInHours} {voiceSearchResults.earlyCheckInHours === 1 ? 'hour' : 'hours'} @ $15/hr):</span>
                          <span>${voiceSearchResults.earlyCheckInCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Show late check-out cost if applicable */}
                      {voiceSearchResults.lateCheckOutHours > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Late Check-out ({voiceSearchResults.lateCheckOutHours} {voiceSearchResults.lateCheckOutHours === 1 ? 'hour' : 'hours'} @ $15/hr):</span>
                          <span>${voiceSearchResults.lateCheckOutCost.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '5px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '11px' }}>Total:</span>
                        <span style={{ fontSize: '11px' }}>${voiceSearchResults.total.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>Sorry, I couldn't understand your request. Please try again.</div>
            )}
          </div>
          {/* Voice search footer removed as requested */}
        </div>
      )}
      
      {/* Floating Draggable Voice Search Button */}
      <button 
        className={`voice-search-button ${isButtonActive ? 'active' : 'inactive'} ${isDragging ? 'dragging' : ''}`}
        onClick={handleVoiceButtonClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          zIndex: 1000,
          touchAction: 'none',
          transition: isDragging ? 'none' : 'opacity 0.3s'
        }}
      >
        {!isButtonActive && (
          <i className="fas fa-microphone"></i>
        )}
        
        {isListening && (
          <div className="voice-wave-container">
            <div className="voice-wave">
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
              <div className="voice-wave-bar"></div>
            </div>
          </div>
        )}

      </button>
    </div>
  );
}

export default MobileView;
