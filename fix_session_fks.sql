-- Script para corregir las foreign keys de session_app
BEGIN;

-- Eliminar constraints antiguas
ALTER TABLE session_app DROP CONSTRAINT IF EXISTS fk_user_business;
ALTER TABLE session_app DROP CONSTRAINT IF EXISTS fk_user_owner;

-- Recrear las constraints permitiendo NULL
ALTER TABLE session_app 
  ADD CONSTRAINT fk_user_business 
  FOREIGN KEY (user_id) 
  REFERENCES user_business(user_id) 
  ON DELETE CASCADE 
  ON UPDATE NO ACTION;

ALTER TABLE session_app 
  ADD CONSTRAINT fk_user_owner 
  FOREIGN KEY (user_owner_id) 
  REFERENCES user_owner(user_owner_id) 
  ON DELETE CASCADE 
  ON UPDATE NO ACTION;

COMMIT;
