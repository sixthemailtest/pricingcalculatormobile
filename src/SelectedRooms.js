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
    }
  };

  // Sort rooms into their respective categories
  selectedRooms.forEach(room => {
    // Categorize room regardless of booking status
    // Multi-purpose rooms appear in BOTH jacuzzi AND non-jacuzzi sections
    if (room.hasJacuzzi) {
      if (room.isSmoking) {
        // Jacuzzi + Smoking
        if (room.bedType === 'Queen') {
          groupedRooms.smokingJacuzzi.queen.push(room);
        } else if (room.bedType === 'King') {
          groupedRooms.smokingJacuzzi.king.push(room);
        }
        
        // Also add to regular smoking if multi-purpose
        if (room.isMultiPurpose) {
          if (room.bedType === 'Queen') {
            groupedRooms.smokingRegular.queen.push(room);
          } else if (room.bedType === 'King') {
            groupedRooms.smokingRegular.king.push(room);
          }
        }
      } else {
        // Jacuzzi + Non-Smoking
        if (room.bedType === 'Queen') {
          groupedRooms.nonSmokingJacuzzi.queen.push(room);
        } else if (room.bedType === 'King') {
          groupedRooms.nonSmokingJacuzzi.king.push(room);
        }
        
        // Also add to regular non-smoking if multi-purpose
        if (room.isMultiPurpose) {
          if (room.bedType === 'Queen') {
            groupedRooms.nonSmokingRegular.queen.push(room);
          } else if (room.bedType === 'King') {
            groupedRooms.nonSmokingRegular.king.push(room);
          }
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
    // Sort the nested structure for all categories
    Object.keys(groupedRooms[category]).forEach(bedType => {
      groupedRooms[category][bedType].sort(sortByFloor);
    });
  });

  // Helper function to render a room card
  // showAsRegular parameter is used for multi-purpose rooms shown in regular sections
  const renderRoomCard = (room, showAsRegular = false) => {
    const bedTypeClass = room.bedType === 'Queen' ? 'queen' : 
                         room.bedType === 'King' ? 'king' : 'queen-2-beds';
    
    const isBooked = bookedRooms.includes(room.number);
    const isMultiPurposeInRegular = showAsRegular && room.isMultiPurpose && room.hasJacuzzi;
    const classes = `room-card ${bedTypeClass} ${room.isSmoking ? 'smoking' : ''} ${room.hasJacuzzi && !isMultiPurposeInRegular ? 'jacuzzi' : ''} ${isBooked ? 'booked' : ''}`;
    
    // For non-booking room cards, use black text and no icons
    if (!isBooked) {
      return (
        <div 
          key={`${room.id}-${showAsRegular ? 'regular' : 'jacuzzi'}`} 
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
          
          {/* Multi-purpose indicator for regular sections */}
          {isMultiPurposeInRegular && (
            <div style={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              fontSize: '6px',
              backgroundColor: '#FFA500',
              color: 'white',
              padding: '1px 3px',
              borderRadius: '3px',
              fontWeight: 'bold',
              lineHeight: '1',
              zIndex: 10
            }}>
              OOO
            </div>
          )}
          
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
        key={`${room.id}-${showAsRegular ? 'regular' : 'jacuzzi'}`}
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
          justifyContent: 'flex-start',
          backgroundColor: '#00A651',
          border: 'none',
          borderRadius: '8px'
        }}
      >
        {/* Remove button */}
        <button 
          className="remove-room-button"
          onClick={() => onRemoveRoom && onRemoveRoom(room.id)}
        >
          ×
        </button>
        
        {/* Multi-purpose indicator for regular sections - show on booked rooms too */}
        {isMultiPurposeInRegular && (
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '3px',
            fontSize: '6px',
            backgroundColor: '#FFA500',
            color: 'white',
            padding: '1px 3px',
            borderRadius: '3px',
            fontWeight: 'bold',
            lineHeight: '1',
            zIndex: 10
          }}>
            OOO
          </div>
        )}
        
        {/* Room number */}
        <span className="room-number" style={{color: 'white', fontWeight: 'bold', fontSize: '14px', marginTop: '8px'}}>{room.number}</span>
        
        {/* Room type */}
        <span className="room-type" style={{color: 'white', fontSize: '9px', marginTop: '-2px', marginBottom: '3px'}}>
          {room.bedType === 'Queen' ? 'Queen' : 
           room.bedType === 'King' ? 'King' : 'Queen 2B'}
        </span>
        
        {/* Room feature indicators - only show if NOT in regular section */}
        {!isMultiPurposeInRegular && (
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
        )}
        
        {room.hasJacuzzi && !isMultiPurposeInRegular && <div className="multiple-label">Multiple</div>}
      </div>
    );
  };

  return (
    <div className="selected-rooms-section">
      {/* Row 1: Non-smoking Queen, King, Queen 2 Beds */}
      {(groupedRooms.nonSmokingRegular.queen.length > 0 || 
        groupedRooms.nonSmokingRegular.king.length > 0 || 
        groupedRooms.nonSmokingRegular.queen2Beds.length > 0) && (
        <div className="selected-rooms-row">
          <div className="row-label-container">
            <div className="row-label">Non-Smoking Rooms</div>
          </div>
          <div className="room-cards-container">
            {[
              ...groupedRooms.nonSmokingRegular.queen,
              ...groupedRooms.nonSmokingRegular.king,
              ...groupedRooms.nonSmokingRegular.queen2Beds
            ].sort((a, b) => {
              // First sort by floor
              const aIsFirstFloor = a.number < 200;
              const bIsFirstFloor = b.number < 200;
              if (aIsFirstFloor && !bIsFirstFloor) return -1;
              if (!aIsFirstFloor && bIsFirstFloor) return 1;
              
              // For first floor, sort by room number
              if (aIsFirstFloor && bIsFirstFloor) {
                return a.number - b.number;
              }
              
              // For second floor, sort by bed type (Queen, King, Queen2Beds), then room number
              const bedTypeOrder = { 'Queen': 1, 'King': 2, 'Queen2Beds': 3 };
              const aOrder = bedTypeOrder[a.bedType];
              const bOrder = bedTypeOrder[b.bedType];
              if (aOrder !== bOrder) return aOrder - bOrder;
              return a.number - b.number;
            }).map(room => renderRoomCard(room, true))}
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
            {[
              ...groupedRooms.smokingRegular.queen,
              ...groupedRooms.smokingRegular.king,
              ...groupedRooms.smokingRegular.queen2Beds
            ].sort((a, b) => {
              // First sort by floor
              const aIsFirstFloor = a.number < 200;
              const bIsFirstFloor = b.number < 200;
              if (aIsFirstFloor && !bIsFirstFloor) return -1;
              if (!aIsFirstFloor && bIsFirstFloor) return 1;
              
              // For first floor, sort by room number
              if (aIsFirstFloor && bIsFirstFloor) {
                return a.number - b.number;
              }
              
              // For second floor, sort by bed type (Queen, King, Queen2Beds), then room number
              const bedTypeOrder = { 'Queen': 1, 'King': 2, 'Queen2Beds': 3 };
              const aOrder = bedTypeOrder[a.bedType];
              const bOrder = bedTypeOrder[b.bedType];
              if (aOrder !== bOrder) return aOrder - bOrder;
              return a.number - b.number;
            }).map(room => renderRoomCard(room, true))}
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
            {[
              ...groupedRooms.nonSmokingJacuzzi.queen,
              ...groupedRooms.nonSmokingJacuzzi.king
            ].sort((a, b) => {
              // First sort by floor
              const aIsFirstFloor = a.number < 200;
              const bIsFirstFloor = b.number < 200;
              if (aIsFirstFloor && !bIsFirstFloor) return -1;
              if (!aIsFirstFloor && bIsFirstFloor) return 1;
              
              // For first floor, sort by room number
              if (aIsFirstFloor && bIsFirstFloor) {
                return a.number - b.number;
              }
              
              // For second floor, sort by bed type (Queen, King), then room number
              const bedTypeOrder = { 'Queen': 1, 'King': 2 };
              const aOrder = bedTypeOrder[a.bedType];
              const bOrder = bedTypeOrder[b.bedType];
              if (aOrder !== bOrder) return aOrder - bOrder;
              return a.number - b.number;
            }).map(room => renderRoomCard(room, false))}
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
            {[
              ...groupedRooms.smokingJacuzzi.queen,
              ...groupedRooms.smokingJacuzzi.king
            ].sort((a, b) => {
              // First sort by floor
              const aIsFirstFloor = a.number < 200;
              const bIsFirstFloor = b.number < 200;
              if (aIsFirstFloor && !bIsFirstFloor) return -1;
              if (!aIsFirstFloor && bIsFirstFloor) return 1;
              
              // For first floor, sort by room number
              if (aIsFirstFloor && bIsFirstFloor) {
                return a.number - b.number;
              }
              
              // For second floor, sort by bed type (Queen, King), then room number
              const bedTypeOrder = { 'Queen': 1, 'King': 2 };
              const aOrder = bedTypeOrder[a.bedType];
              const bOrder = bedTypeOrder[b.bedType];
              if (aOrder !== bOrder) return aOrder - bOrder;
              return a.number - b.number;
            }).map(room => renderRoomCard(room, false))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectedRooms;
