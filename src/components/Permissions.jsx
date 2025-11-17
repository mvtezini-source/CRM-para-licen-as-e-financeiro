import React, { useEffect, useState } from 'react';
import api from '../services/apiService';

export default function Permissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data for roles if API doesn't have endpoint
  const defaultRoles = [
    { id: 1, name: 'Administrador', description: 'Acesso total ao sistema' },
    { id: 2, name: 'Gerente', description: 'Gerencia clientes, licenças e notificações' },
    { id: 3, name: 'Usuário Padrão', description: 'Acesso básico de visualização' },
  ];

  const defaultPermissions = [
    { id: 1, slug: 'manage_clients', name: 'Gerenciar Clientes', description: 'Criar/Editar/Remover clientes' },
    { id: 2, slug: 'manage_licenses', name: 'Gerenciar Licenças', description: 'Emitir/Editar licenças' },
    { id: 3, slug: 'view_logs', name: 'Visualizar Logs', description: 'Visualizar logs do sistema' },
    { id: 4, slug: 'manage_notifications', name: 'Gerenciar Notificações', description: 'Gerenciar notificações' },
    { id: 5, slug: 'manage_users', name: 'Gerenciar Usuários', description: 'Gerenciar usuários e papéis' },
    { id: 6, slug: 'manage_jobs', name: 'Gerenciar Tarefas Agendadas', description: 'Executar e configurar tarefas agendadas' },
  ];

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        
        // Fetch roles - using default if API fails
        let rolesData = defaultRoles;
        try {
          const res = await fetch('http://localhost:4000/api/roles');
          if (res.ok) rolesData = await res.json();
        } catch (err) {
          console.log('Using default roles');
        }

        // Fetch permissions - using default if API fails
        let permissionsData = defaultPermissions;
        try {
          const res = await fetch('http://localhost:4000/api/permissions');
          if (res.ok) permissionsData = await res.json();
        } catch (err) {
          console.log('Using default permissions');
        }

        // Fetch role permissions mapping
        let rolePermsData = {};
        try {
          const res = await fetch('http://localhost:4000/api/role-permissions');
          if (res.ok) {
            const data = await res.json();
            rolesData.forEach(role => {
              rolePermsData[role.id] = data
                .filter(rp => rp.role_id === role.id)
                .map(rp => rp.permission_id);
            });
          }
        } catch (err) {
          console.log('Using default role permissions');
          // Default assignments
          rolePermsData[1] = [1, 2, 3, 4, 5, 6]; // Admin
          rolePermsData[2] = [1, 2, 4, 5]; // Gerente
          rolePermsData[3] = []; // Usuário Padrão
        }

        setRoles(rolesData);
        setPermissions(permissionsData);
        setRolePermissions(rolePermsData);
        if (rolesData.length) setSelectedRole(rolesData[0].id);
        
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados de permissões');
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handlePermissionToggle(roleId, permissionId) {
    setError('');
    setSuccess('');
    
    const currentPerms = rolePermissions[roleId] || [];
    const hasPermission = currentPerms.includes(permissionId);
    
    try {
      if (hasPermission) {
        await fetch(`http://localhost:4000/api/role-permissions/${roleId}/${permissionId}`, {
          method: 'DELETE',
        });
      } else {
        await fetch(`http://localhost:4000/api/role-permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_id: roleId, permission_id: permissionId }),
        });
      }

      // Update local state
      const updated = { ...rolePermissions };
      if (hasPermission) {
        updated[roleId] = currentPerms.filter(p => p !== permissionId);
      } else {
        updated[roleId] = [...currentPerms, permissionId];
      }
      setRolePermissions(updated);
      setSuccess('Permissão atualizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar permissão');
    }
  }

  if (loading) {
    return (
      <div className="crm-container">
        <div className="crm-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando dados de permissões...</p>
        </div>
      </div>
    );
  }

  const currentRolePerms = rolePermissions[selectedRole] || [];
  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="crm-container">
      <div className="crm-card">
        <div className="card-header">
          <div>
            <h2>Gerenciar Permissões de Acesso</h2>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
              Configure as permissões para cada papel (role) do sistema
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Roles Sidebar */}
          <div className="roles-sidebar">
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a' }}>Papéis (Roles)</h3>
            <div className="roles-list">
              {roles.map(role => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`role-item ${selectedRole === role.id ? 'active' : ''}`}
                  style={{
                    padding: '12px 16px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedRole === role.id ? '#e0eaff' : '#f3f4f6',
                    borderLeft: selectedRole === role.id ? '4px solid #0b6cff' : '4px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, color: selectedRole === role.id ? '#0b6cff' : '#0f172a' }}>
                    {role.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                    {(rolePermissions[role.id] || []).length} permissões
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Section */}
          <div className="permissions-section">
            {currentRole && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{currentRole.name}</h3>
                  <p style={{ color: '#6b7280', margin: '0', fontSize: '0.95rem' }}>
                    {currentRole.description}
                  </p>
                </div>

                <div className="permissions-grid">
                  {permissions.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
                      Nenhuma permissão disponível
                    </div>
                  ) : (
                    permissions.map(perm => {
                      const hasPermission = currentRolePerms.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          className="permission-card"
                          style={{
                            padding: '16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            backgroundColor: hasPermission ? '#f0fdf4' : '#f8fafc',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                          }}
                          onClick={() => handlePermissionToggle(selectedRole, perm.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={() => {}}
                              style={{
                                width: '20px',
                                height: '20px',
                                marginTop: '2px',
                                cursor: 'pointer',
                                accentColor: '#0b6cff',
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                {perm.name || perm.slug}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                {perm.description}
                              </div>
                            </div>
                          </div>
                          {hasPermission && (
                            <div style={{ 
                              marginTop: '8px',
                              padding: '6px 10px',
                              backgroundColor: '#10b981',
                              color: '#fff',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-block'
                            }}>
                              ✓ Ativo
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Summary */}
                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Resumo de Permissões</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Permissões Ativas</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
                        {currentRolePerms.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Permissões Disponíveis</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0b6cff' }}>
                        {permissions.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Porcentagem</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
                        {permissions.length > 0 ? Math.round((currentRolePerms.length / permissions.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
