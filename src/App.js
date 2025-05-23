import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';
import MobileView from './MobileView';

function App() {
  // State for current date and time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentDay, setCurrentDay] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [dayStyle, setDayStyle] = useState({});

  // Pricing data
  const [prices, setPrices] = useState({
    weekday: { withoutJacuzzi: 105, withJacuzzi: 120 },
    friday: { withoutJacuzzi: 139, withJacuzzi: 159 },
    weekend: { withoutJacuzzi: 139, withJacuzzi: 169 }
  });
  
  const [shortStayPrices, setShortStayPrices] = useState({
    baseRate: { withoutJacuzzi: 60, withJacuzzi: 90 },
    extraHourRate: { regular: 15, discounted: 10 }
  });

  // Update current date and time
  useEffect(() => {
    const updateCurrentDateTime = () => {
      const now = new Date();
      setCurrentDateTime(now);
      
      // Format day
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[now.getDay()];
      setCurrentDay(dayName);
      
      // Set day style based on weekday/weekend
      if (dayName === 'Friday') {
        setDayStyle({ color: '#FF9500' }); // Orange for Friday
      } else if (dayName === 'Saturday' || dayName === 'Sunday') {
        setDayStyle({ color: '#FF3B30' }); // Red for weekend
      } else {
        setDayStyle({ color: '#34C759' }); // Green for weekdays
      }
      
      // Format date
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };
    
    // Update immediately and then every minute
    updateCurrentDateTime();
    const intervalId = setInterval(updateCurrentDateTime, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App">
      <MobileView 
        currentDay={currentDay}
        currentDate={currentDate}
        currentDateTime={currentDateTime}
        dayStyle={dayStyle}
        prices={prices}
        shortStayPrices={shortStayPrices}
      />
    </div>
  );
}

export default App;
