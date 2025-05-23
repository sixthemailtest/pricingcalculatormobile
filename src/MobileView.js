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
  // State for active tab
  const [activeTab, setActiveTab] = useState('short');
  
  // Short stay state
  const [checkoutTime, setCheckoutTime] = useState('');
  const [extraHours, setExtraHours] = useState(0);
  const [hasJacuzzi, setHasJacuzzi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [extraHourRate, setExtraHourRate] = useState(15);
  const [totalPrice, setTotalPrice] = useState(0);
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
  }, [extraHours]);
  
  // Calculate short stay price
  const calculateShortStayPrice = useCallback(() => {
    // Base rate depends on jacuzzi
    const baseRate = hasJacuzzi 
      ? shortStayPrices.baseRate.withJacuzzi 
      : shortStayPrices.baseRate.withoutJacuzzi;
    
    // Extra hour rate depends on selected rate type
    const hourlyRate = extraHourRate;
    
    // Calculate total
    const extraHoursCost = extraHours * hourlyRate;
    const subtotal = baseRate + extraHoursCost;
    
    // Apply credit card fee if applicable
    const total = paymentMethod === 'credit' ? subtotal * 1.03 : subtotal;
    
    setTotalPrice(total);
  }, [hasJacuzzi, extraHours, extraHourRate, paymentMethod, shortStayPrices]);
  
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
    
    // Clone check-in date to iterate through days
    const currentDate = new Date(checkInDate);
    
    // Count each day type
    for (let i = 0; i < nights; i++) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (dayOfWeek === 5) { // Friday
        daysBreakdown.friday++;
      } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        daysBreakdown.weekend++;
      } else { // Weekday
        daysBreakdown.weekday++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate base price based on room type and days
    const roomPrices = hasJacuzziOvernight ? 
      { weekday: prices.weekday.withJacuzzi, friday: prices.friday.withJacuzzi, weekend: prices.weekend.withJacuzzi } :
      { weekday: prices.weekday.withoutJacuzzi, friday: prices.friday.withoutJacuzzi, weekend: prices.weekend.withoutJacuzzi };
    
    const totalBasePrice = 
      (daysBreakdown.weekday * roomPrices.weekday) +
      (daysBreakdown.friday * roomPrices.friday) +
      (daysBreakdown.weekend * roomPrices.weekend);
    
    // Calculate extra hours cost
    const hourlyRate = overnightRateType === 'regular' ? 
      shortStayPrices.extraHourRate.regular : 
      shortStayPrices.extraHourRate.discounted;
    
    const extraHoursCheckInCost = overnightExtraHours * hourlyRate;
    const extraHoursCheckOutCost = overnightCheckoutExtraHours * hourlyRate;
    
    // Calculate tax (15%)
    const taxAmount = totalBasePrice * 0.15;
    
    // Calculate total
    let totalPrice = totalBasePrice + taxAmount + extraHoursCheckInCost + extraHoursCheckOutCost;
    
    // Apply credit card fee if applicable
    if (overnightPayment === 'credit') {
      totalPrice *= 1.03; // 3% credit card fee
    }
    
    return {
      nights,
      daysBreakdown,
      totalBasePrice,
      taxAmount,
      extraHoursCheckInCost,
      extraHoursCheckOutCost,
      totalPrice
    };
  }, [checkInDate, checkOutDate, hasJacuzziOvernight, overnightExtraHours, overnightCheckoutExtraHours, overnightRateType, overnightPayment, prices, shortStayPrices]);
  
  // Handle extra hours change for short stay
  const handleExtraHoursChange = (change) => {
    setExtraHours(prevHours => Math.max(0, prevHours + change));
  };
  
  // Handle extra hours change for overnight stay check-in
  const handleOvernightExtraHoursChange = (change) => {
    setOvernightExtraHours(prevHours => Math.max(0, prevHours + change));
  };
  
  // Handle extra hours change for overnight stay checkout
  const handleOvernightCheckoutExtraHoursChange = (change) => {
    setOvernightCheckoutExtraHours(prevHours => Math.max(0, prevHours + change));
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
  
  // Calculate overnight price info
  const overnightPriceInfo = calculateOvernightPrice();
  
  // Get daily prices
  const dailyPrices = getDailyPrice();
  
  // Generate sample available rooms if none exist
  useEffect(() => {
    if (availableRooms.length === 0) {
      const rooms = [];
      
      // Generate room numbers 101-120
      for (let i = 101; i <= 120; i++) {
        // Determine room characteristics based on room number
        const isSmoking = i % 2 === 0;
        const hasJacuzzi = i > 110;
        const bedType = i % 3 === 0 ? 'Queen2Beds' : (i % 3 === 1 ? 'Queen' : 'King');
        
        rooms.push({
          id: `room-${i}`,
          number: i,
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
    
    if (isSelected) {
      // Remove from selected rooms
      setSelectedRooms(selectedRooms.filter(r => r.id !== room.id));
    } else {
      // Add to selected rooms
      setSelectedRooms([...selectedRooms, room]);
    }
  };
  
  // Toggle room selector modal
  const toggleRoomSelector = () => {
    setShowRoomSelector(!showRoomSelector);
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
      
      {/* Tabs */}
      <div className="iphone-tabs">
        <button 
          className={`tab-button ${activeTab === 'short' ? 'active' : ''}`}
          onClick={() => setActiveTab('short')}
        >
          Short Stay
        </button>
        <button 
          className={`tab-button ${activeTab === 'overnight' ? 'active' : ''}`}
          onClick={() => setActiveTab('overnight')}
        >
          Multiple Nights
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {/* Room selector button */}
        <button className="room-selector-button" onClick={toggleRoomSelector}>
          {selectedRooms.length > 0 ? `Selected Rooms (${selectedRooms.length})` : 'Select Rooms'}
        </button>
        
        {/* Selected Rooms Component */}
        {selectedRooms.length > 0 && (
          <SelectedRooms selectedRooms={selectedRooms} />
        )}
        
        {/* Room Selector Modal */}
        {showRoomSelector && (
          <div className="room-selector-modal">
            <div className="room-selector-content">
              <div className="room-selector-header">
                <h3>Select Rooms</h3>
                <button className="close-button" onClick={toggleRoomSelector}>×</button>
              </div>
              <div className="available-rooms-grid">
                {availableRooms.map(room => {
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
                <button onClick={() => handleExtraHoursChange(-1)}>-</button>
                <span>{extraHours}</span>
                <button onClick={() => handleExtraHoursChange(1)}>+</button>
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
            
            <div className="checkout-time">
              <span>Checkout Time:</span>
              <span>{checkoutTime}</span>
            </div>
            
            <div className="price-summary">
              <div className="price-row">
                <span>Base Price:</span>
                <span>${hasJacuzzi ? shortStayPrices.baseRate.withJacuzzi : shortStayPrices.baseRate.withoutJacuzzi}</span>
              </div>
              {extraHours > 0 && (
                <div className="price-row">
                  <span>Extra Hours ({extraHours} × ${extraHourRate}):</span>
                  <span>${extraHours * extraHourRate}</span>
                </div>
              )}
              {paymentMethod === 'credit' && (
                <div className="price-row">
                  <span>Credit Card Fee (3%):</span>
                  <span>${((hasJacuzzi ? shortStayPrices.baseRate.withJacuzzi : shortStayPrices.baseRate.withoutJacuzzi) + (extraHours * extraHourRate)) * 0.03}</span>
                </div>
              )}
              <div className="price-row total">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="multi-night-section">
            <div className="date-pickers">
              <div className="date-picker-container">
                <span>Check-in Date</span>
                <DatePicker
                  selected={checkInDate}
                  onChange={handleCheckInChange}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  className="date-picker"
                />
              </div>
              <div className="date-picker-container">
                <span>Check-out Date</span>
                <DatePicker
                  selected={checkOutDate}
                  onChange={handleCheckOutChange}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
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
                <button 
                  className={overnightBedType === 'Queen2Beds' ? 'active' : ''}
                  onClick={() => setOvernightBedType('Queen2Beds')}
                >
                  Queen 2 Beds
                </button>
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
              <label>Early Check-in Hours</label>
              <div className="counter-control">
                <button onClick={() => handleOvernightExtraHoursChange(-1)}>-</button>
                <span>{overnightExtraHours}</span>
                <button onClick={() => handleOvernightExtraHoursChange(1)}>+</button>
              </div>
            </div>
            
            <div className="option-group">
              <label>Late Check-out Hours</label>
              <div className="counter-control">
                <button onClick={() => handleOvernightCheckoutExtraHoursChange(-1)}>-</button>
                <span>{overnightCheckoutExtraHours}</span>
                <button onClick={() => handleOvernightCheckoutExtraHoursChange(1)}>+</button>
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
            
            <div className="price-summary">
              <div className="price-row">
                <span>Base Price ({overnightPriceInfo.nights} nights):</span>
                <span>${overnightPriceInfo.totalBasePrice?.toFixed(2)}</span>
              </div>
              {overnightPriceInfo.taxAmount > 0 && (
                <div className="price-row">
                  <span>Tax (15%):</span>
                  <span>${overnightPriceInfo.taxAmount?.toFixed(2)}</span>
                </div>
              )}
              {overnightPriceInfo.extraHoursCheckInCost > 0 && (
                <div className="price-row">
                  <span>Early Check-in:</span>
                  <span>${overnightPriceInfo.extraHoursCheckInCost?.toFixed(2)}</span>
                </div>
              )}
              {overnightPriceInfo.extraHoursCheckOutCost > 0 && (
                <div className="price-row">
                  <span>Late Check-out:</span>
                  <span>${overnightPriceInfo.extraHoursCheckOutCost?.toFixed(2)}</span>
                </div>
              )}
              {overnightPayment === 'credit' && (
                <div className="price-row">
                  <span>Credit Card Fee (3%):</span>
                  <span>${((overnightPriceInfo.totalBasePrice + overnightPriceInfo.taxAmount + 
                    overnightPriceInfo.extraHoursCheckInCost + overnightPriceInfo.extraHoursCheckOutCost) * 0.03).toFixed(2)}</span>
                </div>
              )}
              <div className="price-row total">
                <span>Total:</span>
                <span>${overnightPriceInfo.totalPrice?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileView;
