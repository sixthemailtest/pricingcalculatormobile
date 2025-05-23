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
  const [activeFloor, setActiveFloor] = useState('ground'); // 'ground' or 'first'
  
  // State for saved stays
  const [savedStays, setSavedStays] = useState([]);
  // State for active tab
  const [activeTab, setActiveTab] = useState('short');
  
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
  
  // Default check-in date (today at 3 PM)
  const defaultCheckIn = new Date();
  defaultCheckIn.setHours(15, 0, 0, 0);
  
  // Default checkout date (tomorrow at 11 AM)
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
  defaultCheckOut.setHours(11, 0, 0, 0);
  
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  
  // Calculate checkout time based on current time and extra hours
  const calculateCheckoutTime = useCallback(() => {
    const now = new Date();
    const checkoutDate = new Date(now.getTime() + ((4 + extraHours) * 60 * 60 * 1000));
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    setCheckoutTime(checkoutDate.toLocaleTimeString('en-US', timeOptions));
    
    // Also format current time
    const checkinTime = now.toLocaleTimeString('en-US', timeOptions);
    return { checkinTime, checkoutTime: checkoutDate.toLocaleTimeString('en-US', timeOptions) };
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
    
    // Calculate tax (always 15% regardless of payment method)
    const taxAmount = baseRate * 0.15;
    
    // Total is base + tax + extra hours
    const total = baseRate + taxAmount + extraHoursCost;
    
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
    
    // Calculate tax (always 15% regardless of payment method)
    const taxAmount = totalBasePrice * 0.15;
    
    // Calculate extra hours cost
    const hourlyRate = overnightRateType === 'regular' ? 
      shortStayPrices.extraHourRate.regular : 
      shortStayPrices.extraHourRate.discounted;
    
    // For early check-in, overnightExtraHours is negative, so we need to use Math.abs
    const extraHoursCheckInCost = Math.abs(overnightExtraHours) * hourlyRate;
    const extraHoursCheckOutCost = overnightCheckoutExtraHours * hourlyRate;
    
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
  
  // Handle extra hours change for short stay
  const handleExtraHoursChange = (change) => {
    setExtraHours(prevHours => {
      const newValue = Math.max(0, prevHours + change);
      // Calculate and update checkout time immediately
      const now = new Date();
      const checkoutDate = new Date(now.getTime() + ((4 + newValue) * 60 * 60 * 1000));
      const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
      const checkinTime = now.toLocaleTimeString('en-US', timeOptions);
      const checkoutTimeStr = checkoutDate.toLocaleTimeString('en-US', timeOptions);
      setCheckoutTime(checkoutTimeStr);
      return newValue;
    });
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
  
  // Update calculations when dependencies change
  useEffect(() => {
    calculateCheckoutTime();
    calculateShortStayPrice();
  }, [calculateCheckoutTime, calculateShortStayPrice]);
  
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
      
      // Generate ground floor room numbers 101-120
      for (let i = 101; i <= 120; i++) {
        // Determine room characteristics based on room number
        const isSmoking = i % 2 === 0;
        const hasJacuzzi = i > 110;
        const bedType = i % 3 === 0 ? 'Queen2Beds' : (i % 3 === 1 ? 'Queen' : 'King');
        
        rooms.push({
          id: `room-${i}`,
          number: i,
          floor: 'ground',
          isSmoking,
          hasJacuzzi,
          bedType,
          isAvailable: true
        });
      }
      
      // Generate first floor room numbers 201-220
      for (let i = 201; i <= 220; i++) {
        // Determine room characteristics based on room number
        const isSmoking = i % 2 === 0;
        const hasJacuzzi = i > 210;
        const bedType = i % 3 === 0 ? 'Queen2Beds' : (i % 3 === 1 ? 'Queen' : 'King');
        
        rooms.push({
          id: `room-${i}`,
          number: i,
          floor: 'first',
          isSmoking,
          hasJacuzzi,
          bedType,
          isAvailable: true
        });
      }
      
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
        ) : (
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
        )}
      </div>
      
      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'short' ? 'active' : ''}`}
          onClick={() => setActiveTab('short')}
        >
          SHORT STAY
        </button>
        <button 
          className={`tab ${activeTab === 'overnight' ? 'active' : ''}`}
          onClick={() => setActiveTab('overnight')}
        >
          MULTIPLE NIGHTS
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content" data-tab={activeTab}>
        
        {/* Selected Rooms Component */}
        {selectedRooms.length > 0 && (
          <SelectedRooms 
            selectedRooms={selectedRooms} 
            onRemoveRoom={handleRemoveRoom} 
          />
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

        
        {activeTab === 'short' ? (
          <div className="short-stay-section">
            <div className="option-group">
              <label>Room Type</label>
              <div className="toggle-buttons bed-type">
                <button 
                  className={bedType === 'Queen' ? 'active' : ''}
                  onClick={() => setBedType('Queen')}
                >
                  Queen
                </button>
                <button 
                  className={bedType === 'King' ? 'active' : ''}
                  onClick={() => setBedType('King')}
                >
                  King
                </button>
                <button 
                  className={bedType === 'Queen2Beds' ? 'active' : ''}
                  onClick={() => setBedType('Queen2Beds')}
                >
                  Queen 2 Beds
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Jacuzzi</label>
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
            
            <div className="option-group">
              <label>Smoking</label>
              <div className="toggle-buttons">
                <button 
                  className={!isSmoking ? 'active' : ''}
                  onClick={() => setIsSmoking(false)}
                >
                  Non-Smoking
                </button>
                <button 
                  className={isSmoking ? 'active' : ''}
                  onClick={() => setIsSmoking(true)}
                >
                  Smoking
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Payment Method</label>
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
                  Credit Card
                </button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Extra Hours</label>
              <div className="counter-control">
                <button className="minus-button" onClick={() => handleExtraHoursChange(-1)}>-</button>
                <span>{extraHours}</span>
                <button className="plus-button" onClick={() => handleExtraHoursChange(1)}>+</button>
              </div>
            </div>
            
            <div className="simple-time-display">
              <div className="time-row">
                <span className="time-label">Check-in:</span>
                <span className="time-value">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>
              <div className="time-row">
                <span className="time-label">Check-out:</span>
                <span className="time-value">{checkoutTime}</span>
              </div>
            </div>
            
            <div className="option-group">
              <label>Extra Hour Rate</label>
              <div className="toggle-buttons">
                <button 
                  className={extraHourRate === 15 ? 'active' : ''}
                  onClick={() => setExtraHourRate(15)}
                >
                  Regular ($15)
                </button>
                <button 
                  className={extraHourRate === 10 ? 'active' : ''}
                  onClick={() => setExtraHourRate(10)}
                >
                  Discounted ($10)
                </button>
              </div>
            </div>
            

            
            {showShortStayPriceSummary && (
              <div className="price-summary">
                <div className="price-row">
                  <span>Base Price:</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="price-row">
                    <span>Tax (15%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {extraHours > 0 && (
                  <div className="price-row">
                    <span>Extra Hours ({extraHours} × ${extraHourRate}):</span>
                    <span>${extraHoursCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="price-row total">
                  <span>Total:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
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
              <label>Jacuzzi</label>
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
              <label>Payment Method</label>
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
                        <div className="price-row">
                          <span>Base Price:</span>
                          <span>${stay.basePrice.toFixed(2)}</span>
                        </div>
                        
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
      
      {/* Floating add button removed */}
    </div>
  );
}

export default MobileView;
