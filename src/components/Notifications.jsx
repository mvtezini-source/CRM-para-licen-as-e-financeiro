import React, { useEffect, useState } from 'react';
import api, { getCurrentUser, markNotificationRead } from '../services/apiService';


export default function Notifications() {
  const [notifs, setNotifs] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function load(){
      const n = await api.getNotifications();
      setNotifs(n || []);
      try{
        const u = await getCurrentUser();
        setCurrentUser(u);
      }catch(e){}
    }
    load();
  }, []);

  async function markRead(id) {
    await markNotificationRead(id);
    setNotifs(await api.getNotifications());
  }

  return (
    <div className="crm-card">
      <h3>Notificações</h3>
      {notifs.length === 0 && <div>Sem notificações</div>}
      {currentUser && currentUser.permissions && currentUser.permissions.includes('manage_notifications') && (
        <div style={{marginTop:12}} className="form-inline">
          <input id="new-notif" placeholder="Nova notificação" />
          <button onClick={async ()=>{ const el=document.getElementById('new-notif'); if(el && el.value){ await api.addNotification(el.value); setNotifs(await api.getNotifications()); el.value=''; } }}>Criar</button>
        </div>
      )}
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
