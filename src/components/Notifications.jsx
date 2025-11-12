import React, { useEffect, useState } from 'react';
import dataService from '../services/dataService';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    setNotifs(dataService.getNotifications());
  }, []);

  function markRead(id) {
    dataService.markNotificationRead(id);
    setNotifs(dataService.getNotifications());
  }

  return (
    <div className="crm-card">
      <h3>Notificações</h3>
      {notifs.length === 0 && <div>Sem notificações</div>}
      <ul>
        {notifs.map(n => (
          <li key={n.id} className={n.read ? 'notif-read' : 'notif-new'}>
            <div>{n.text}</div>
            <small>{new Date(n.at).toLocaleString()}</small>
            {!n.read && <button onClick={() => markRead(n.id)}>Marcar lida</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
