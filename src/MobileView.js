import React, { useState, useEffect, useCallback, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './MobileView.css';
import SelectedRooms from './SelectedRooms';

function MobileView({ currentDay, currentDate, currentDateTime, dayStyle, prices, shortStayPrices }) {
  // State for selected rooms
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // State for voice search
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [voiceSearchResults, setVoiceSearchResults] = useState(null);
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
  
  // Update current date and time
  const updateCurrentDateTime = useCallback(() => {
    const now = new Date();
    
    // Format date
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    setFormattedCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    
    // Format time with seconds
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    setCurrentTime(timeString);
    
    // Don't update checkout time here - it will be handled by the extraHours useEffect
  }, []);
  
  // Calculate checkout time based on current time and extra hours
  const calculateCheckoutTime = useCallback((customNow = null) => {
    const now = customNow || new Date();
    
    // Calculate checkout time (current time + 4 hours + extra hours)
    const checkoutDate = new Date(now.getTime() + ((4 + extraHours) * 60 * 60 * 1000));
    
    // Format checkout time with seconds
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const formattedCheckoutTime = checkoutDate.toLocaleTimeString('en-US', timeOptions);
    
    // Set state
    setCheckoutTime(formattedCheckoutTime);
    
    return formattedCheckoutTime;
  }, [extraHours]);
  
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
      } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        daysBreakdown.weekend++;
        dayPrice = roomPrices.weekend;
      } else { // Weekday
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
    
    // Calculate tax based on payment method
    let taxAmount;
    if (overnightPayment === 'credit') {
      // Apply 15% tax to both base price and extra hours for credit card
      taxAmount = (totalBasePrice + totalExtraHoursCost) * 0.15;
    } else {
      // For cash payment, only apply tax to base price
      taxAmount = totalBasePrice * 0.15;
    }
    
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
    } else if (day === 0 || day === 6) { // Sunday or Saturday
      return { regular: prices.weekend.withoutJacuzzi, jacuzzi: prices.weekend.withJacuzzi };
    } else { // Weekday
      return { regular: prices.weekday.withoutJacuzzi, jacuzzi: prices.weekday.withJacuzzi };
    }
  }, [currentDateTime, prices]);
  
  // Effect to initialize checkout time and set up timer for current time
  useEffect(() => {
    // Initial update for current time
    updateCurrentDateTime();
    
    // Initial update for checkout time (current time + 4 hours)
    const now = new Date();
    const checkoutDate = new Date(now.getTime() + ((4 + extraHours) * 60 * 60 * 1000));
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const checkoutTimeStr = checkoutDate.toLocaleTimeString('en-US', timeOptions);
    setCheckoutTime(checkoutTimeStr);
    
    // Initial price calculation
    calculateShortStayPrice();
    
    // Set up timer to update only the current time every second
    const timer = setInterval(() => {
      updateCurrentDateTime();
    }, 1000);
    
    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, [updateCurrentDateTime, calculateShortStayPrice, extraHours]);
  
  // Update checkout time and price calculation when extraHours changes
  useEffect(() => {
    // Update checkout time based on current time and extra hours
    const now = new Date();
    const checkoutDate = new Date(now.getTime() + ((4 + extraHours) * 60 * 60 * 1000));
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const checkoutTimeStr = checkoutDate.toLocaleTimeString('en-US', timeOptions);
    setCheckoutTime(checkoutTimeStr);
    
    // Also update price calculation
    calculateShortStayPrice();
  }, [extraHours, calculateShortStayPrice]);
  
  // Clear short stay selections
  const clearShortStay = () => {
    setExtraHours(0);
    setSelectedRooms([]);
    setBedType('Queen');
    setHasJacuzzi(false);
    setIsSmoking(false);
    setPaymentMethod('cash');
    setTaxAmount(0);
    setBasePrice(0);
    setExtraHoursCost(0);
    setTotalPrice(0);
    calculateCheckoutTime();
    setShowShortStayPriceSummary(false);
    
    // Clear selected rooms from local storage
    try {
      localStorage.removeItem('selectedRooms');
    } catch (error) {
      console.error('Error clearing rooms from local storage:', error);
    }
  };
  
  // Clear overnight stay selections
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
    
    // Clear selected rooms from local storage
    try {
      localStorage.removeItem('selectedRooms');
      setSelectedRooms([]);
    } catch (error) {
      console.error('Error clearing rooms from local storage:', error);
    }
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
        // Ground floor (100s)
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
        
        // First floor (200s)
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
      // Just create the instance to warm up the API
      const warmupRecognition = new SpeechRecognition();
      console.log('Speech recognition pre-initialized');
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
    recognition.continuous = true;
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
  
  // Improved voice recognition that captures complete phrases
  const startImprovedVoiceRecognition = () => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
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
    
    // iOS-specific settings
    if (isIOS) {
      // These settings help with iOS recognition
      recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy
    }
    
    console.log('Starting improved voice recognition...', isIOS ? 'on iOS device' : 'on non-iOS device');
    
    recognition.onresult = (event) => {
      // Get the complete transcript
      const transcript = event.results[0][0].transcript;
      console.log('Complete voice transcript:', transcript);
      
      // Update the transcript in state
      setVoiceSearchQuery(transcript);
      
      // Pre-process the transcript to fix common misrecognitions
      let processedTranscript = transcript;
      
      // Fix "Queen" vs "King" confusion
      const lowerTranscript = transcript.toLowerCase();
      
      // Look for clear indicators of "King" bed
      if (lowerTranscript.includes('king') || 
          lowerTranscript.includes('keen') || 
          lowerTranscript.includes('kin')) {
        // Check if there are strong indicators this is actually a King bed
        if (!lowerTranscript.includes('queen') || 
            lowerTranscript.indexOf('king') < lowerTranscript.indexOf('queen')) {
          // Replace with clear "King" for processing
          processedTranscript = transcript.replace(/\b(king|keen|kin)\b/gi, 'King');
          console.log('Detected King bed, processed transcript:', processedTranscript);
        }
      }
      
      // Process the enhanced transcript
      processVoiceSearch(processedTranscript);
    };
    
    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      setIsButtonActive(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle iOS-specific errors
      if (isIOS && event.error === 'not-allowed') {
        alert('Please allow microphone access in your device settings to use voice search.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected');
      }
      
      setIsListening(false);
      setIsButtonActive(false);
    };
    
    // Start recognition
    try {
      recognition.start();
      console.log('Voice recognition started');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsButtonActive(false);
      setIsListening(false);
      
      // Show a helpful message for iOS users
      if (isIOS) {
        alert('Speech recognition failed to start. Please make sure you have granted microphone permissions in your device settings.');
      }
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
  
  // Handle voice search button press (original method)
  const handleVoiceButtonPress = (e) => {
    e.preventDefault(); // Prevent default behavior
    
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
    const recognition = createNewRecognitionInstance();
    if (!recognition) {
      console.error('Failed to create speech recognition instance');
      return;
    }
    
    // Store in ref for later access
    recognitionRef.current = recognition;
    
    // Create a variable to store the transcript for this specific session
    let sessionTranscript = '';
    
    recognition.onstart = () => {
      console.log(`Recognition started for session ${searchSessionId}`);
    };
    
    recognition.onresult = (event) => {
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
      setIsListening(false);
    };
    
    // Start recognition
    try {
      recognition.start();
      console.log(`Recognition successfully started for session ${searchSessionId}`);
    } catch (error) {
      console.error(`Error starting recognition for session ${searchSessionId}:`, error);
      setIsButtonActive(false);
      setIsListening(false);
    }
    
    // Add event listeners for button release
    document.addEventListener('touchend', (event) => handleVoiceButtonRelease(event, searchSessionId, sessionTranscript));
    document.addEventListener('touchcancel', (event) => handleVoiceButtonRelease(event, searchSessionId, sessionTranscript));
    document.addEventListener('mouseup', (event) => handleVoiceButtonRelease(event, searchSessionId, sessionTranscript));
  };
  
  // Handle voice search button release with session ID and transcript
  const handleVoiceButtonRelease = (e, sessionId, sessionTranscript) => {
    if (e) e.preventDefault();
    
    // Only process if this is the active button press
    if (!isButtonActive) return;
    
    console.log(`Button released for session ${sessionId}`);
    setIsButtonActive(false);
    
    // Capture the current transcript from state as a fallback
    const stateTranscript = voiceSearchQuery;
    
    // Use the session transcript if available, otherwise fall back to state
    // This is crucial for preventing cross-session contamination
    const finalTranscript = sessionTranscript || stateTranscript;
    console.log(`Final transcript for session ${sessionId}:`, finalTranscript);
    
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log(`Recognition stopped for session ${sessionId}`);
      } catch (error) {
        console.error(`Error stopping recognition for session ${sessionId}:`, error);
      }
      
      // Clean up the recognition instance
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current = null;
      } catch (e) {
        console.log(`Error cleaning up recognition for session ${sessionId}:`, e);
      }
    }
    
    // Remove all event listeners
    document.removeEventListener('touchend', handleVoiceButtonRelease);
    document.removeEventListener('touchcancel', handleVoiceButtonRelease);
    document.removeEventListener('mouseup', handleVoiceButtonRelease);
    
    // Process the query
    if (finalTranscript && finalTranscript.trim().length > 0) {
      console.log(`Processing query for session ${sessionId}:`, finalTranscript.trim());
      processVoiceSearch(finalTranscript.trim(), sessionId);
    } else {
      console.log(`No speech detected for session ${sessionId}`);
      const emptyResults = {
        query: "No speech detected",
        foundMatch: false,
        noSpeechDetected: true,
        sessionId: sessionId,
        timestamp: Date.now()
      };
      setVoiceSearchResults(emptyResults);
      setShowVoiceSearchResults(true);
    }
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
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Process the query
    setTimeout(() => {
      // Process the query first
      processVoiceSearchInternal(query, specificCheckIn, specificCheckOut, searchId);
      
      // Show the results
      setShowVoiceSearchResults(true);
      
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
  
  // Internal implementation of voice search processing with complete isolation
  const processVoiceSearchInternal = (query, specificCheckIn = null, specificCheckOut = null, searchId = null) => {
    // Don't process empty or very short queries
    if (!query || query.trim().length < 3) {
      console.log('Query too short, not processing');
      return;
    }
    
    // Store the detected query for watermark display
    if (!detectedVoiceQuery) {
      setDetectedVoiceQuery({
        query: query,
        originalTranscript: query
      });
    }
    
    // Convert query to lowercase for easier matching
    const lowerQuery = query.toLowerCase();
    console.log('Processing voice query:', lowerQuery);
    
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
    
    // Initialize results object with a timestamp and searchId to ensure uniqueness
    let results = {
      query: query,
      timestamp: Date.now(), // Add timestamp to prevent caching issues
      searchId: searchId || `search-${Date.now()}`, // Use provided searchId or generate a new one
      nights: 1,
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      bedType: 'Queen', // Default to Queen
      hasJacuzzi: false,
      isSmoking: false, // Always non-smoking by default
      price: 0,
      tax: 0,
      total: 0,
      dailyPrices: [], // Add array for daily price breakdown
      foundMatch: false,
      validRoomTypes: validRoomTypes, // Add valid room types for reference
      validCombinations: validCombinations, // Add valid combinations for reference
      invalidRoomType: false, // Flag for invalid room type
      requestedInvalidType: '', // Store the invalid room type that was requested
      invalidCombination: false, // Flag for invalid room combination
      requestedInvalidCombination: '' // Store the invalid combination that was requested
    };
    
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
    
    // Check for specific days
    daysOfWeek.forEach(day => {
      if (lowerQuery.includes(day)) {
        mentionedDays.push(day);
        dateDetected = true;
      }
    });
    
    // Check for specific date mentions (e.g., "26th June")
    let specificDateDetected = false;
    const datePatterns = [
      // Format: "26th June", "26 June", "June 26th", "June 26"
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/i,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
    ];
    
    let specificDay, specificMonth, specificYear;
    
    // Try each date pattern
    for (const pattern of datePatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        if (match[1] && isNaN(parseInt(match[1]))) {
          // Month is first (e.g., "June 26th")
          specificMonth = months[match[1].toLowerCase()];
          specificDay = parseInt(match[2]);
        } else {
          // Day is first (e.g., "26th June")
          specificDay = parseInt(match[1]);
          specificMonth = months[match[2].toLowerCase()];
        }
        
        // Validate day of month
        if (specificDay >= 1 && specificDay <= 31) {
          specificDateDetected = true;
          dateDetected = true;
          break;
        }
      }
    }
    
    // If specific date detected, set check-in and check-out dates
    if (specificDateDetected) {
      // Default to current year
      specificYear = voiceToday.getFullYear();
      
      // If the month is earlier than current month, assume next year
      if (specificMonth < voiceToday.getMonth()) {
        specificYear++;
      }
      // If same month but day has passed, assume next year
      else if (specificMonth === voiceToday.getMonth() && specificDay < voiceToday.getDate()) {
        specificYear++;
      }
      
      // Set check-in date to the specific date at 3 PM
      voiceCheckInDate = new Date(specificYear, specificMonth, specificDay, 15, 0, 0, 0);
      
      // Set check-out date to the next day at 11 AM
      voiceCheckOutDate = new Date(voiceCheckInDate);
      voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 1);
      voiceCheckOutDate.setHours(11, 0, 0, 0);
      
      voiceNights = 1;
      console.log(`Specific date detected: ${voiceCheckInDate.toDateString()}`);
    }
    // Check for "tomorrow"
    else if (lowerQuery.includes('tomorrow')) {
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
    else if (lowerQuery.includes('today')) {
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      voiceCheckOutDate = new Date(voiceCheckInDate);
      voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 1);
      voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
      
      voiceNights = 1;
      dateDetected = true;
    }
    // Check for "next week" with improved handling for "whole week" and similar phrases
    else if (lowerQuery.includes('next week')) {
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setDate(voiceToday.getDate() + 7); // One week from today
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      // Check if user wants the "whole week" or similar phrases
      const wholeWeekPhrases = ['whole week', 'full week', 'entire week', 'all week', 'week long'];
      const isWholeWeek = wholeWeekPhrases.some(phrase => lowerQuery.includes(phrase));
      
      if (isWholeWeek) {
        // Set to a full 7-night stay for "whole week"
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 7);
        voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        voiceNights = 7;
      } else {
        // Default to a 2-night weekend stay
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 2);
        voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        voiceNights = 2;
      }
      
      dateDetected = true;
    }
    // Check for "weekend"
    else if (lowerQuery.includes('weekend')) {
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
      const currentDayIndex = voiceToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find the first mentioned day
      const firstDay = mentionedDays[0];
      const firstDayIndex = dayIndices[firstDay];
      
      // Calculate days until the first mentioned day
      let daysUntilFirstDay = firstDayIndex - currentDayIndex;
      if (daysUntilFirstDay <= 0) daysUntilFirstDay += 7; // If it's in the past, go to next week
      
      // Set check-in date
      voiceCheckInDate = new Date(voiceToday);
      voiceCheckInDate.setDate(voiceToday.getDate() + daysUntilFirstDay);
      voiceCheckInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      
      // If multiple days mentioned, set check-out date based on the last day
      if (mentionedDays.length > 1) {
        // Sort the mentioned days to ensure they're in order of the week
        const sortedDays = [...mentionedDays].sort((a, b) => dayIndices[a] - dayIndices[b]);
        
        // Find consecutive days to determine actual stay duration
        let consecutiveDays = [];
        let currentSequence = [sortedDays[0]];
        
        for (let i = 1; i < sortedDays.length; i++) {
          const prevDayIndex = dayIndices[sortedDays[i-1]];
          const currDayIndex = dayIndices[sortedDays[i]];
          
          // Check if days are consecutive or wrap around the week
          if (currDayIndex === (prevDayIndex + 1) % 7) {
            currentSequence.push(sortedDays[i]);
          } else {
            // Not consecutive, start a new sequence
            if (currentSequence.length > consecutiveDays.length) {
              consecutiveDays = [...currentSequence];
            }
            currentSequence = [sortedDays[i]];
          }
        }
        
        // Check if the last sequence is the longest
        if (currentSequence.length > consecutiveDays.length) {
          consecutiveDays = [...currentSequence];
        }
        
        // If we found consecutive days, use them; otherwise use all mentioned days
        const daysToUse = consecutiveDays.length > 1 ? consecutiveDays : sortedDays;
        
        // Calculate check-in based on first day in sequence
        const firstSequenceDay = daysToUse[0];
        const firstSequenceDayIndex = dayIndices[firstSequenceDay];
        let daysUntilSequenceStart = firstSequenceDayIndex - currentDayIndex;
        if (daysUntilSequenceStart <= 0) daysUntilSequenceStart += 7;
        
        voiceCheckInDate = new Date(voiceToday);
        voiceCheckInDate.setDate(voiceToday.getDate() + daysUntilSequenceStart);
        voiceCheckInDate.setHours(15, 0, 0, 0);
        
        // Calculate check-out based on last day in sequence
        const lastSequenceDay = daysToUse[daysToUse.length - 1];
        const lastSequenceDayIndex = dayIndices[lastSequenceDay];
        
        // Calculate the actual number of nights based on the mentioned days
        let nightsCount = daysToUse.length;
        
        // Set check-out date to the day AFTER the last mentioned night
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + nightsCount);
        voiceCheckOutDate.setHours(11, 0, 0, 0);
        
        voiceNights = nightsCount;
      } else {
        // If only one day mentioned, assume 1 night stay
        voiceCheckOutDate = new Date(voiceCheckInDate);
        voiceCheckOutDate.setDate(voiceCheckInDate.getDate() + 1);
        voiceCheckOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        voiceNights = 1;
      }
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
    console.log('Voice query for bed type detection:', lowerQuery);
  
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
      const matches = lowerQuery.match(regex);
      if (matches) kingScore += matches.length;
    });
  
    // Check for queen indicators
    queenIndicators.forEach(indicator => {
      const regex = new RegExp('\\b' + indicator + '\\b', 'gi');
      const matches = lowerQuery.match(regex);
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
        if (lowerQuery.includes(keyword)) {
          roomTypePatterns[roomType].weight += 1;
          console.log(`Match found for ${roomType}: '${keyword}'`);
        }
      }
      
      // Check for pattern matches (more accurate with word boundaries)
      for (const pattern of data.patterns) {
        if (pattern.test(lowerQuery)) {
          roomTypePatterns[roomType].weight += 2; // Patterns have higher weight
          console.log(`Pattern match for ${roomType}: ${pattern}`);
        }
      }
      
      // Check for negations
      for (const negation of data.negations) {
        if (negation.test(lowerQuery)) {
          roomTypePatterns[roomType].weight -= 3; // Strong negative weight
          console.log(`Negation found for ${roomType}: ${negation}`);
        }
      }
      
      // Context-based adjustments
      if (roomType === 'Queen2Beds') {
        // If user mentions capacity for 3-4 people, boost Queen2Beds
        if (/\b(for|fits|sleeps|accommodates)\s+([34]|three|four)\s+(people|persons|guests)\b/i.test(lowerQuery)) {
          roomTypePatterns[roomType].weight += 3;
          console.log(`Capacity context boost for ${roomType}`);
        }
      }
    }
    
    // Check for invalid room types first
    if (roomTypePatterns['Invalid'].weight > 0) {
      invalidRoomTypeRequested = true;
      
      // Determine which invalid type was requested
      if (lowerQuery.includes('suite')) requestedInvalidType = 'Suite';
      else if (lowerQuery.includes('penthouse')) requestedInvalidType = 'Penthouse';
      else if (lowerQuery.includes('twin')) requestedInvalidType = 'Twin beds';
      else if (lowerQuery.includes('single')) requestedInvalidType = 'Single bed';
      
      console.log('Invalid room type requested:', requestedInvalidType);
      
      // Suggest a suitable alternative
      if (lowerQuery.includes('twin') || lowerQuery.includes('single')) {
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
    if (lowerQuery.includes('double') && !lowerQuery.includes('queen') && !lowerQuery.includes('king')) {
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
        if (lowerQuery.includes(keyword)) {
          featurePatterns[feature].weight += 1;
          console.log(`Match found for ${feature}: '${keyword}'`);
        }
      }
      
      // Check for pattern matches (more accurate with word boundaries)
      for (const pattern of data.patterns) {
        if (pattern.test(lowerQuery)) {
          featurePatterns[feature].weight += 2; // Patterns have higher weight
          console.log(`Pattern match for ${feature}: ${pattern}`);
        }
      }
      
      // Check for negations
      for (const negation of data.negations) {
        if (negation.test(lowerQuery)) {
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
    
    for (let i = 0; i < results.nights; i++) {
      const currentDate = new Date(checkInDate);
      currentDate.setDate(checkInDate.getDate() + i);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      let dayPrice = 0;
      let dayType = '';
      
      if (dayOfWeek === 5) { // Friday
        dayPrice = roomPrices.friday;
        dayType = 'Friday';
      } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        dayPrice = roomPrices.weekend;
        dayType = 'Weekend';
      } else { // Weekday
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
    
    // Calculate tax (15%)
    const tax = basePrice * 0.15;
    
    // Set price information
    results.price = basePrice;
    results.tax = tax;
    results.total = basePrice + tax;
    results.foundMatch = true;
    
    // Set the final results with forced state update to prevent caching
    results.foundMatch = true;
    results.uniqueId = `result-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
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
      setVoiceSearchResults(results);
      setShowVoiceSearchResults(true);
      
      // Also reset any active recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          recognitionRef.current = null;
        } catch (e) {
          console.log('Error cleaning up recognition:', e);
        }
      }
      
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
  
  // Handle voice button click (tap-to-start/tap-to-stop)
  const handleVoiceButtonClick = () => {
    // If already listening, stop recognition
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Voice recognition stopped by user');
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    } else {
      // Otherwise, start recognition
      startImprovedVoiceRecognition();
    }
  };
  
  // Close voice search results
  const closeVoiceSearchResults = () => {
    console.log('Closing voice search results modal');
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Reset modal state
    setShowVoiceSearchResults(false);
    setVoiceSearchResults(null);
    setVoiceSearchQuery('');
    setVoiceSearchError(null);
    
    // Reset body overflow (important for iOS)
    document.body.style.overflow = 'auto';
    
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
          <span className="price-label">Today's Room Prices</span>
          <div className="price-value">${dailyPrices.regular} - ${dailyPrices.jacuzzi}</div>
        </div>
      </div>
      
      {/* Button container for select rooms and clear */}
      <div className="top-buttons-container">
        {activeTab === 'short' ? (
          <>
            <button className="select-rooms-top-button" onClick={toggleRoomSelector}>
              {selectedRooms.length > 0 ? `Selected Rooms (${selectedRooms.length})` : 'Select Rooms'}
            </button>
            <button 
              className="small-clear-button" 
              onClick={clearShortStay}
            >
              Clear
            </button>
          </>
        ) : activeTab === 'overnight' ? (
          <>
            <button className="add-stay-button" onClick={saveCurrentStay}>
              + Add Stay
            </button>
            <button 
              className="small-clear-button" 
              onClick={clearOvernightStay}
            >
              Clear
            </button>
          </>
        ) : (
          // No buttons for rooms tab
          <div></div>
        )}
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
            onRemoveRoom={handleRemoveRoom} 
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
                Ground Floor
              </button>
              <button 
                className={`floor-tab ${activeFloor === 'first' ? 'active' : ''}`}
                onClick={() => setActiveFloor('first')}
              >
                First Floor
              </button>
            </div>
            
            <div className="all-rooms-container">
              {availableRooms
                .filter(room => room.floor === (activeFloor === 'ground' ? 'ground' : 'first'))
                .map(room => (
                  <div 
                    key={room.id}
                    className="room-card-container"
                    onMouseEnter={(e) => handleCardMouseEnter(room, e)}
                    onMouseLeave={handleCardMouseLeave}
                    onMouseMove={handleCardMouseMove}
                  >
                    <div 
                      className={`room-card ${room.bedType === 'Queen' ? 'queen' : 
                                 room.bedType === 'King' ? 'king' : 'queen-2-beds'} 
                                 ${room.isSmoking ? 'smoking' : ''} 
                                 ${room.hasJacuzzi ? 'jacuzzi' : ''}`}
                    >
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
                  Ground Floor
                </button>
                <button 
                  className={`floor-tab ${activeFloor === 'first' ? 'active' : ''}`}
                  onClick={() => setActiveFloor('first')}
                >
                  First Floor
                </button>
              </div>
              
              <div className={`available-rooms-grid ${activeFloor === 'first' ? 'first-floor-active' : ''}`}>
                {availableRooms
                  .filter(room => room.floor === 'ground')
                  .map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                                       room.bedType === 'King' ? 'king' : 'queen-2-beds';
                    
                    const classes = `room-selector-card ${bedTypeClass} ${room.isSmoking ? 'smoking' : ''} ${room.hasJacuzzi ? 'jacuzzi' : ''} ${isSelected ? 'selected' : ''}`;
                    
                    return (
                      <div 
                        key={room.id} 
                        className={classes}
                        onClick={() => handleRoomSelect(room)}
                      >
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
                  
                {/* First Floor Rooms - Initially hidden via CSS */}
                {availableRooms
                  .filter(room => room.floor === 'first')
                  .map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                                       room.bedType === 'King' ? 'king' : 'queen-2-beds';
                    
                    const classes = `room-selector-card first-floor ${bedTypeClass} ${room.isSmoking ? 'smoking' : ''} ${room.hasJacuzzi ? 'jacuzzi' : ''} ${isSelected ? 'selected' : ''}`;
                    
                    return (
                      <div 
                        key={room.id} 
                        className={classes}
                        onClick={() => handleRoomSelect(room)}
                      >
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
                    <span>Tax (15%):</span>
                    <span>${overnightPriceInfo.taxAmount?.toFixed(2)}</span>
                  </div>
                )}
                {overnightPriceInfo.extraHoursCheckInCost > 0 && (
                  <div className="price-row">
                    <span>Early Check-in ({Math.abs(overnightExtraHours)} hrs @ {overnightRateType === 'regular' ? '$15' : '$10'}/hr):</span>
                    <span>${overnightPriceInfo.extraHoursCheckInCost?.toFixed(2)}</span>
                  </div>
                )}
                {overnightPriceInfo.extraHoursCheckOutCost > 0 && (
                  <div className="price-row">
                    <span>Late Check-out ({overnightCheckoutExtraHours} hrs @ {overnightRateType === 'regular' ? '$15' : '$10'}/hr):</span>
                    <span>${overnightPriceInfo.extraHoursCheckOutCost?.toFixed(2)}</span>
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
            <div className="voice-search-query">You said: "{voiceSearchResults.query}"</div>
            
            {voiceSearchResults.recognitionError ? (
              <div className="recognition-error">
                <p><i className="fas fa-exclamation-circle"></i></p>
                <p><strong>Speech recognition error</strong></p>
                <p>There was a problem with the speech recognition service. Please try again.</p>
              </div>
            ) : voiceSearchResults.noSpeechDetected ? (
              <div className="no-speech-error">
                <p><i className="fas fa-microphone-slash"></i></p>
                <p><strong>No speech detected</strong></p>
                <p>Please press and hold the microphone button and speak clearly.</p>
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
                
                <div>
                  <strong>Stay Details:</strong>
                  <ul>
                    <li>Check-in: {voiceSearchResults.checkInDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</li>
                    <li>Check-out: {voiceSearchResults.checkOutDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</li>
                    <li>Nights: {voiceSearchResults.nights}</li>
                    <li>Room Type: {voiceSearchResults.bedType === 'Queen2Beds' ? 'Queen 2 Beds' : voiceSearchResults.bedType}</li>
                    {/* Only show jacuzzi label if it was mentioned in the search query */}
                    {voiceSearchResults.query.toLowerCase().includes('jacuzzi') || 
                     voiceSearchResults.query.toLowerCase().includes('hot tub') || 
                     voiceSearchResults.query.toLowerCase().includes('spa') ? (
                      <li>{voiceSearchResults.hasJacuzzi ? 'With Jacuzzi' : 'No Jacuzzi'}</li>
                    ) : null}
                    <li>{voiceSearchResults.isSmoking ? 'Smoking' : 'Non-Smoking'}</li>
                  </ul>
                </div>
                
                <div className="voice-search-price-card">
                  {/* Daily price breakdown - only show if more than 1 night */}
                  {voiceSearchResults.dailyPrices && voiceSearchResults.dailyPrices.length > 1 && (
                    <div className="daily-price-breakdown">
                      <div className="breakdown-header">Daily Price Breakdown:</div>
                      {voiceSearchResults.dailyPrices.map((day, index) => (
                        <div key={index} className="daily-price">
                          <span>{day.dayOfWeek}, {day.date}</span>
                          <span>${day.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Base Price:</span>
                    <span>${voiceSearchResults.price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Tax (15%):</span>
                    <span>${voiceSearchResults.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1em', marginTop: '5px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <span>Total:</span>
                    <span>${voiceSearchResults.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>Sorry, I couldn't understand your request. Please try again.</div>
            )}
          </div>
          {/* Voice search footer removed as requested */}
        </div>
      )}
      
      {/* Floating Voice Search Button - Changed to tap-to-start/tap-to-stop for iOS compatibility */}
      <button 
        className={`voice-search-button ${isButtonActive ? 'active' : 'inactive'}`}
        onClick={handleVoiceButtonClick}
        aria-label={isListening ? 'Tap to stop' : 'Tap to start voice search'}
      >
        <i className={`fas ${isButtonActive ? 'fa-microphone-alt' : 'fa-microphone'}`}></i>
        <span className="voice-button-label">{isListening ? 'Tap to stop' : 'Tap to talk'}</span>
      </button>
    </div>
  );
}

export default MobileView;
