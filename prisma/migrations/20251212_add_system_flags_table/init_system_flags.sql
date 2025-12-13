-- Tabla para banderas globales del sistema (ej: mantenimiento)
CREATE TABLE IF NOT EXISTS system_flags (
    key VARCHAR(50) PRIMARY KEY,
    is_active BOOLEAN DEFAULT false,
    message VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar valores iniciales
INSERT INTO system_flags (key, is_active, message) VALUES 
('maintenance_admin', false, 'Estamos actualizando el panel administrativo.'),
('maintenance_public', false, 'El sistema de pedidos está en mantenimiento.')
ON CONFLICT (key) DO NOTHING;