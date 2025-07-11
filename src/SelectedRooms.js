import React from 'react';
import './SelectedRooms.css';
import './RoomIndicators.css';

function SelectedRooms({ selectedRooms = [], bookedRooms = [], onRemoveRoom, onClearBookedRooms }) {
  // Group rooms by their characteristics
  const groupedRooms = {
    nonSmokingRegular: {
      queen: [],
      king: [],
      queen2Beds: []
    },
    smokingRegular: {
      queen: [],
      king: [],
      queen2Beds: []
    },
    nonSmokingJacuzzi: {
      queen: [],
      king: []
    },
    smokingJacuzzi: {
      queen: [],
      king: []
    },
    bookedRooms: [] // New category for booked rooms
  };

  // Sort rooms into their respective categories
  selectedRooms.forEach(room => {
    // Check if the room is booked
    if (bookedRooms.includes(room.number)) {
      groupedRooms.bookedRooms.push(room);
    } else if (room.hasJacuzzi) {
      if (room.isSmoking) {
        // Jacuzzi + Smoking
        if (room.bedType === 'Queen') {
          groupedRooms.smokingJacuzzi.queen.push(room);
        } else if (room.bedType === 'King') {
          groupedRooms.smokingJacuzzi.king.push(room);
        }
      } else {
        // Jacuzzi + Non-Smoking
        if (room.bedType === 'Queen') {
          groupedRooms.nonSmokingJacuzzi.queen.push(room);
        } else if (room.bedType === 'King') {
          groupedRooms.nonSmokingJacuzzi.king.push(room);
        }
      }
    } else {
      if (room.isSmoking) {
        // No Jacuzzi + Smoking
        if (room.bedType === 'Queen') {
          groupedRooms.smokingRegular.queen.push(room);
        } else if (room.bedType === 'King') {
          groupedRooms.smokingRegular.king.push(room);
        } else if (room.bedType === 'Queen2Beds') {
          groupedRooms.smokingRegular.queen2Beds.push(room);
        }
      } else {
        // No Jacuzzi + Non-Smoking
        if (room.bedType === 'Queen') {
          groupedRooms.nonSmokingRegular.queen.push(room);
        } else if (room.bedType === 'King') {
          groupedRooms.nonSmokingRegular.king.push(room);
        } else if (room.bedType === 'Queen2Beds') {
          groupedRooms.nonSmokingRegular.queen2Beds.push(room);
        }
      }
    }
  });
  
  // Sort each room category by floor (first floor first, then second floor)
  // First floor rooms have numbers 100-199, second floor rooms have numbers 200+
  const sortByFloor = (a, b) => {
    // First sort by floor (first floor first)
    const aIsGroundFloor = a.number < 200;
    const bIsGroundFloor = b.number < 200;
    
    if (aIsGroundFloor && !bIsGroundFloor) return -1;
    if (!aIsGroundFloor && bIsGroundFloor) return 1;
    
    // Then sort by room number within the same floor
    return a.number - b.number;
  };
  
  // Apply sorting to all room categories
  Object.keys(groupedRooms).forEach(category => {
    if (category === 'bookedRooms') {
      // Sort the flat bookedRooms array
      groupedRooms.bookedRooms.sort(sortByFloor);
    } else {
      // Sort the nested structure for other categories
      Object.keys(groupedRooms[category]).forEach(bedType => {
        groupedRooms[category][bedType].sort(sortByFloor);
      });
    }
  });

  // Helper function to render a room card
  const renderRoomCard = (room) => {
    const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                         room.bedType === 'King' ? 'king' : 'queen-2-beds';
    
    const isBooked = bookedRooms.includes(room.number);
    const classes = `room-card ${bedTypeClass} ${room.isSmoking ? 'smoking' : ''} ${room.hasJacuzzi ? 'jacuzzi' : ''} ${isBooked ? 'booked' : ''}`;
    
    // For non-booking room cards, use black text and no icons
    if (!isBooked) {
      return (
        <div 
          key={room.id} 
          className={classes}
          style={{
            width: '70px',
            height: '70px',
            maxWidth: '70px',
            maxHeight: '70px',
            padding: '5px',
            boxSizing: 'border-box',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Remove button */}
          <button 
            className="remove-room-button"
            onClick={() => onRemoveRoom && onRemoveRoom(room.id)}
          >
            ×
          </button>
          
          {/* Room number */}
          <span className="room-number" style={{color: 'black', fontWeight: 'bold', fontSize: '16px'}}>{room.number}</span>
          
          {/* Room type */}
          <span className="room-type" style={{color: 'black', fontSize: '10px', marginTop: '2px'}}>
            {room.bedType === 'Queen' ? 'Queen' : 
             room.bedType === 'King' ? 'King' : 'Queen 2B'}
          </span>
        </div>
      );
    }
    
    // For booking room cards, keep the icons and white text
    return (
      <div 
        key={room.id} 
        className={classes}
        style={{
          width: '70px',
          height: '70px',
          maxWidth: '70px',
          maxHeight: '70px',
          padding: '5px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}
      >
        {/* Remove button */}
        <button 
          className="remove-room-button"
          onClick={() => onRemoveRoom && onRemoveRoom(room.id)}
        >
          ×
        </button>
        
        {/* Room number */}
        <span className="room-number" style={{color: 'white', fontWeight: 'bold', fontSize: '14px', marginTop: '8px'}}>{room.number}</span>
        
        {/* Room type */}
        <span className="room-type" style={{color: 'white', fontSize: '9px', marginTop: '-2px', marginBottom: '3px'}}>
          {room.bedType === 'Queen' ? 'Queen' : 
           room.bedType === 'King' ? 'King' : 'Queen 2B'}
        </span>
        
        {/* Room feature indicators */}
        <div className="room-indicator">
          {/* Smoking status indicator */}
          <span className={`indicator-icon ${room.isSmoking ? 'smoking-icon' : 'non-smoking-icon'}`}>
            {room.isSmoking ? '🚬' : '🚭'}
          </span>
          
          {/* Jacuzzi indicator */}
          {room.hasJacuzzi && (
            <span className="indicator-icon jacuzzi-icon">
              💦
            </span>
          )}
        </div>
        
        {room.hasJacuzzi && <div className="multiple-label">Multiple</div>}
      </div>
    );
  };

  return (
    <div className="selected-rooms-section">
      {/* Booking Rooms Section */}
      {groupedRooms.bookedRooms.length > 0 && (
        <div className="selected-rooms-row booking-rooms-row">
          <div className="row-label-container">
            <div className="row-label">Booking Rooms</div>
          </div>
          <div className="room-cards-container">
            {groupedRooms.bookedRooms.map(room => {
              const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                                   room.bedType === 'King' ? 'king' : 'queen-2-beds';
              
              return (
                <div 
                  key={room.id} 
                  className={`room-card ${bedTypeClass} booking-card`}
                  style={{
                    width: '70px',
                    height: '70px',
                    backgroundColor: '#00A651',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start'
                  }}
                >
                  {/* Remove button */}
                  <button 
                    className="remove-room-button"
                    onClick={() => onRemoveRoom && onRemoveRoom(room.id)}
                  >
                    ×
                  </button>
                  
                  {/* Room number */}
                  <span className="room-number" style={{color: 'white', fontWeight: 'bold', fontSize: '14px', marginTop: '8px'}}>{room.number}</span>
                  
                  {/* Room type */}
                  <span className="room-type" style={{color: 'white', fontSize: '9px', marginTop: '-2px', marginBottom: '3px'}}>
                    {room.bedType === 'Queen' ? 'Queen' : 
                     room.bedType === 'King' ? 'King' : 'Queen 2B'}
                  </span>
                  
                  {/* Room feature indicators */}
                  <div className="room-indicator">
                    {/* Smoking status indicator */}
                    <span className={`indicator-icon ${room.isSmoking ? 'smoking-icon' : 'non-smoking-icon'}`}>
                      {room.isSmoking ? '🚬' : '🚭'}
                    </span>
                    
                    {/* Jacuzzi indicator */}
                    {room.hasJacuzzi && (
                      <span className="indicator-icon jacuzzi-icon">
                        💦
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Row 1: Non-smoking Queen, King, Queen 2 Beds */}
      {(groupedRooms.nonSmokingRegular.queen.length > 0 || 
        groupedRooms.nonSmokingRegular.king.length > 0 || 
        groupedRooms.nonSmokingRegular.queen2Beds.length > 0) && (
        <div className="selected-rooms-row">
          <div className="row-label-container">
            <div className="row-label">Non-Smoking Rooms</div>
          </div>
          <div className="room-cards-container">
            {groupedRooms.nonSmokingRegular.queen.map(renderRoomCard)}
            {groupedRooms.nonSmokingRegular.king.map(renderRoomCard)}
            {groupedRooms.nonSmokingRegular.queen2Beds.map(renderRoomCard)}
          </div>
        </div>
      )}

      {/* Row 2: Smoking Queen, King, Queen 2 Beds */}
      {(groupedRooms.smokingRegular.queen.length > 0 || 
        groupedRooms.smokingRegular.king.length > 0 || 
        groupedRooms.smokingRegular.queen2Beds.length > 0) && (
        <div className="selected-rooms-row">
          <div className="row-label-container">
            <div className="row-label">Smoking Rooms</div>
          </div>
          <div className="room-cards-container">
            {groupedRooms.smokingRegular.queen.map(renderRoomCard)}
            {groupedRooms.smokingRegular.king.map(renderRoomCard)}
            {groupedRooms.smokingRegular.queen2Beds.map(renderRoomCard)}
          </div>
        </div>
      )}

      {/* Row 3: Jacuzzi Non-smoking Queen, King */}
      {(groupedRooms.nonSmokingJacuzzi.queen.length > 0 || 
        groupedRooms.nonSmokingJacuzzi.king.length > 0) && (
        <div className="selected-rooms-row">
          <div className="row-label-container">
            <div className="row-label">Jacuzzi Non-Smoking Rooms</div>
          </div>
          <div className="room-cards-container">
            {groupedRooms.nonSmokingJacuzzi.queen.map(renderRoomCard)}
            {groupedRooms.nonSmokingJacuzzi.king.map(renderRoomCard)}
          </div>
        </div>
      )}

      {/* Row 4: Jacuzzi Smoking Queen, King */}
      {(groupedRooms.smokingJacuzzi.queen.length > 0 || 
        groupedRooms.smokingJacuzzi.king.length > 0) && (
        <div className="selected-rooms-row">
          <div className="row-label-container">
            <div className="row-label">Jacuzzi Smoking Rooms</div>
          </div>
          <div className="room-cards-container">
            {groupedRooms.smokingJacuzzi.queen.map(renderRoomCard)}
            {groupedRooms.smokingJacuzzi.king.map(renderRoomCard)}
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectedRooms;
