import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './MobileView.css';
import SelectedRooms from './SelectedRooms';

function MobileView({ currentDay, currentDate, currentDateTime, dayStyle, prices, shortStayPrices }) {
  // State for selected rooms
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [showVoiceSearchResults, setShowVoiceSearchResults] = useState(false);
  const [voiceSearchResults, setVoiceSearchResults] = useState(null);
  
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
  
  // Voice search functionality
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    setIsListening(true);
    setVoiceSearchQuery('');
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceSearchQuery(transcript);
      processVoiceSearch(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  
  // Process voice search query
  const processVoiceSearch = (query) => {
    // Convert query to lowercase for easier matching
    const lowerQuery = query.toLowerCase();
    
    // Initialize results object
    let results = {
      query: query,
      nights: 1,
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      bedType: 'Queen',
      hasJacuzzi: false,
      isSmoking: false,
      price: 0,
      tax: 0,
      total: 0,
      foundMatch: false
    };
    
    // Extract days of the week
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const mentionedDays = [];
    
    daysOfWeek.forEach(day => {
      if (lowerQuery.includes(day)) {
        mentionedDays.push(day);
      }
    });
    
    // Set check-in and check-out dates based on mentioned days
    if (mentionedDays.length > 0) {
      const today = new Date();
      const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Map day names to day indices
      const dayIndices = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };
      
      // Find the first mentioned day
      const firstDay = mentionedDays[0];
      const firstDayIndex = dayIndices[firstDay];
      
      // Calculate days until the first mentioned day
      let daysUntilFirstDay = firstDayIndex - currentDayIndex;
      if (daysUntilFirstDay <= 0) daysUntilFirstDay += 7; // If it's in the past, go to next week
      
      // Set check-in date
      const checkInDate = new Date(today);
      checkInDate.setDate(today.getDate() + daysUntilFirstDay);
      checkInDate.setHours(15, 0, 0, 0); // 3 PM check-in
      results.checkInDate = checkInDate;
      
      // If multiple days mentioned, set check-out date based on the last day
      if (mentionedDays.length > 1) {
        const lastDay = mentionedDays[mentionedDays.length - 1];
        const lastDayIndex = dayIndices[lastDay];
        
        // Calculate days between first and last day
        let daysBetween = lastDayIndex - firstDayIndex;
        if (daysBetween <= 0) daysBetween += 7; // If it wraps around to the next week
        
        // Set check-out date
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkInDate.getDate() + daysBetween);
        checkOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        results.checkOutDate = checkOutDate;
        
        // Calculate nights
        results.nights = daysBetween;
      } else {
        // If only one day mentioned, assume 1 night stay
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkInDate.getDate() + 1);
        checkOutDate.setHours(11, 0, 0, 0); // 11 AM check-out
        results.checkOutDate = checkOutDate;
        results.nights = 1;
      }
    }
    
    // Extract bed type
    if (lowerQuery.includes('king')) {
      results.bedType = 'King';
    } else if (lowerQuery.includes('queen') && (lowerQuery.includes('double') || lowerQuery.includes('two') || lowerQuery.includes('2') || lowerQuery.includes('beds'))) {
      results.bedType = 'Queen2Beds';
    } else {
      results.bedType = 'Queen';
    }
    
    // Check for jacuzzi
    if (lowerQuery.includes('jacuzzi') || lowerQuery.includes('hot tub') || lowerQuery.includes('spa')) {
      results.hasJacuzzi = true;
    }
    
    // Check for smoking preference
    if (lowerQuery.includes('smoking')) {
      results.isSmoking = true;
    } else if (lowerQuery.includes('non-smoking') || lowerQuery.includes('non smoking')) {
      results.isSmoking = false;
    }
    
    // Calculate price based on extracted information
    const roomPrices = results.hasJacuzzi ? 
      { weekday: prices.weekday.withJacuzzi, friday: prices.friday.withJacuzzi, weekend: prices.weekend.withJacuzzi } :
      { weekday: prices.weekday.withoutJacuzzi, friday: prices.friday.withoutJacuzzi, weekend: prices.weekend.withoutJacuzzi };
    
    // Calculate base price
    let basePrice = 0;
    const checkInDate = new Date(results.checkInDate);
    
    for (let i = 0; i < results.nights; i++) {
      const dayOfWeek = checkInDate.getDay(); // 0 = Sunday, 6 = Saturday
      let dayPrice = 0;
      
      if (dayOfWeek === 5) { // Friday
        dayPrice = roomPrices.friday;
      } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        dayPrice = roomPrices.weekend;
      } else { // Weekday
        dayPrice = roomPrices.weekday;
      }
      
      // Add bed type surcharge
      if (results.bedType === 'King') {
        dayPrice += 5; // $5 extra per night for King
      } else if (results.bedType === 'Queen2Beds') {
        dayPrice += 10; // $10 extra per night for Queen 2 Beds
      }
      
      basePrice += dayPrice;
      
      // Move to next day
      checkInDate.setDate(checkInDate.getDate() + 1);
    }
    
    // Calculate tax (15%)
    const tax = basePrice * 0.15;
    
    // Set price information
    results.price = basePrice;
    results.tax = tax;
    results.total = basePrice + tax;
    results.foundMatch = true;
    
    // Show results
    setVoiceSearchResults(results);
    setShowVoiceSearchResults(true);
  };
  
  // Close voice search results
  const closeVoiceSearchResults = () => {
    setShowVoiceSearchResults(false);
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
      {/* Voice Search Button - positioned absolutely */}
      <button 
        className={`voice-search-button ${isListening ? 'listening' : ''}`}
        onClick={startVoiceSearch}
      >
        <i className="fas fa-microphone"></i>
      </button>
      
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
      
      {/* Voice Search Results Popup */}
      {showVoiceSearchResults && voiceSearchResults && (
        <div className="voice-search-results">
          <div className="voice-search-header">
            <h3>Voice Search Results</h3>
            <button onClick={closeVoiceSearchResults}>×</button>
          </div>
          <div className="voice-search-content">
            <div className="voice-search-query">You said: "{voiceSearchResults.query}"</div>
            
            {voiceSearchResults.foundMatch ? (
              <div>
                <div>
                  <strong>Stay Details:</strong>
                  <ul>
                    <li>Check-in: {voiceSearchResults.checkInDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</li>
                    <li>Check-out: {voiceSearchResults.checkOutDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</li>
                    <li>Nights: {voiceSearchResults.nights}</li>
                    <li>Room Type: {voiceSearchResults.bedType === 'Queen' ? 'Queen' : voiceSearchResults.bedType === 'King' ? 'King' : 'Queen 2 Beds'}</li>
                    <li>{voiceSearchResults.hasJacuzzi ? 'With Jacuzzi' : 'Without Jacuzzi'}</li>
                    <li>{voiceSearchResults.isSmoking ? 'Smoking' : 'Non-Smoking'}</li>
                  </ul>
                </div>
                
                <div className="voice-search-price-card">
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
          <div className="voice-search-footer">
            <button className="voice-search-close-button" onClick={closeVoiceSearchResults}>Close</button>
          </div>
        </div>
      )}
      
      {/* Floating add button removed */}
    </div>
  );
}

export default MobileView;
