# 📄 PRD.md - Product Requirement Document
## Sistema de Control de Inventario TI, Actas DER y Guías de Despacho

### 1. Visión General del Producto
Plataforma web PWA (Progressive Web App) diseñada con enfoque **Mobile-First** para la gestión integral de activos TI en plantas industriales. Permite registrar movimientos de inventario, emitir Actas de Entrega/Retiro (DER) con firma digital híbrida, procesar Guías de Despacho (Sonda y Teknoservice), y controlar el ciclo de vida completo de los equipos con trazabilidad y auditoría en tiempo real.

---

### 2. Roles de Usuario y Permisos
- **Admin (Godofredo):** Control total del sistema, dashboard de auditoría con comparativa diff, mantenedores de categorías/modelos/filiales, gestión de usuarios, recepción de alertas por correo y administración de la Papelera de Reciclaje (Soft Delete).
- **Operator (Carlos / Asistente):** Registro y actualización de inventario, emisión de Actas DER, lectura de Guías de Despacho y atenciones en terreno. *Sin permisos de borrado permanente ni configuración.*
- **Viewer (Jefatura TI / Auditores):** Solo lectura de información, consultas de estado en tiempo real y exportación de reportes a Excel/PDF.

---

### 3. Matriz ENUM de Estados del Equipo (`equipment_status`)
1. `EN_BODEGA`: Disponible en stock para entrega.
2. `ASIGNADO`: Entregado oficialmente a un usuario con DER firmado.
3. `PRESTAMO_TEMPORAL`: Asignación rápida de contingencia sin DER formal. *(Validación: Bloquea préstamos si el equipo ya está `ASIGNADO`)*.
4. `EN_REEMPLAZO_LAB`: Equipo de reemplazo entregado por Sonda mientras el original se repara. *(Validación: Compara RAM/Storage >= Original)*.
5. `EN_LABORATORIO_SONDA`: Equipo enviado a reparación. *(Vinculación automática mediante referencias cruzadas con el equipo de reemplazo)*.
6. `NO_ENTREGADO_A_TI`: Usuario desvinculado/ex-empleado que no ha devuelto el equipo a TI.
7. `RECUPERADO_SIN_ACTA`: Devuelto por RRHH u otra área sin haber llenado un DER.
8. `DE_BAJA_RENOVADO`: Retirado por cumplimiento de ciclo de facturación/rental.
9. `REGISTRO_INCOMPLETO_ATENCION`: Captura rápida durante formateos/atenciones en terreno *(Genera recordatorio para completar "Meses de Operación")*.

---

### 4. Categorías Oficiales de Equipos (`equipment_category`)
- `LAPTOP`, `DESKTOP`, `PRINTER_COLOR`, `PRINTER_BN`, `ZEBRA_LABEL`, `ZEBRA_TRF`, `VIDEO_CONFERENCIA`, `SERVER`, `TABLET`.

---

### 5. Flujos Clave y Reglas de Negocio
1. **Firma Híbrida en Actas DER:** Canvas táctil para firma digital en vivo O carga/captura de foto del acta física firmada.
2. **Procesamiento de Guías de Despacho:**
   - **Sonda S.A. (Recepción):** Captura N° Guía, Orden Compra (`DOC...`), Ticket (`WO...`), Usuario Final y Serie. Genera ingreso a inventario.
   - **Teknoservice / Sonda (Retiro):** Captura N° Guía y Serie para marcar salida a baja/reciclaje.
3. **Auditoría y Notificaciones Admin:**
   - Alerta por correo transaccional (Resend/SMTP) al Admin ante modificaciones manuales, soft deletes o desvinculaciones hechas por el `Operator`.
   - Historial cronológico (`audit_logs`) con vista comparativa "Antes y Después".
4. **Almacenamiento en Google Drive:**
   - Nomenclaturas estrictas:
     - DER: `DER_[Ticket]_[Usuario]_[Serie]_[Fecha].pdf`
     - Recepción: `GUIA_RECEPCION_[Ticket]_[NumGuia]_[Cantidad]_[Fecha].pdf`
     - Retiro: `GUIA_RETIRO_[Ticket]_[NumGuia]_[Cantidad]_[Fecha].pdf`