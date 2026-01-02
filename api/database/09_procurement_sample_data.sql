-- ============================================
-- PROCUREMENT MODULE - SAMPLE DATA
-- ============================================
-- This file contains sample data for vendor products, contracts, documents, and purchase orders
-- Run this after creating the tables from 08_procurement_schema_extensions.sql

-- Sample Vendor Products (for vendor ID 31 - Intellibiz Africa Ltd)
INSERT INTO vendor_products (vendorId, productCode, productName, category, unit, unitPrice, description, isActive) VALUES
(31, 'IT-001', 'Laptop Computer - Dell Latitude', 'IT Equipment', 'piece', 85000.00, 'Dell Latitude 5520, Intel i5, 8GB RAM, 256GB SSD', TRUE),
(31, 'IT-002', 'Desktop Computer - HP ProDesk', 'IT Equipment', 'piece', 65000.00, 'HP ProDesk 400 G8, Intel i5, 8GB RAM, 512GB SSD', TRUE),
(31, 'IT-003', 'Network Switch - 24 Port', 'Networking', 'piece', 25000.00, '24-port Gigabit Ethernet Switch', TRUE),
(31, 'IT-004', 'Wireless Router', 'Networking', 'piece', 12000.00, 'Dual-band WiFi 6 Router', TRUE),
(31, 'IT-005', 'Printer - HP LaserJet', 'IT Equipment', 'piece', 45000.00, 'HP LaserJet Pro M404dn, Monochrome', TRUE),
(31, 'IT-006', 'Monitor - 24 inch', 'IT Equipment', 'piece', 18000.00, '24-inch Full HD LED Monitor', TRUE),
(31, 'IT-007', 'Keyboard and Mouse Set', 'IT Accessories', 'set', 3500.00, 'Wireless Keyboard and Mouse Combo', TRUE),
(31, 'IT-008', 'USB Flash Drive - 64GB', 'IT Accessories', 'piece', 2500.00, '64GB USB 3.0 Flash Drive', TRUE);

-- Sample Vendor Contracts (for vendor ID 31)
INSERT INTO vendor_contracts (vendorId, contractNumber, contractType, startDate, endDate, contractValue, currency, status, renewalOption, keyTerms, notes, createdBy) VALUES
(31, 'CNT-2024-001', 'Annual Supply', '2024-01-01', '2024-12-31', 5000000.00, 'KES', 'active', TRUE, 
'Annual IT equipment supply contract\nMinimum order value: KES 500,000\nPayment terms: Net 30\nWarranty: 1 year on all equipment', 
'Primary IT equipment supplier for 2024', 1),
(31, 'CNT-2023-045', 'Service Agreement', '2023-06-01', '2024-05-31', 1200000.00, 'KES', 'expired', FALSE,
'IT support and maintenance services\nMonthly retainer: KES 100,000\nResponse time: 4 hours\nCoverage: Business hours only',
'Previous year service contract', 1);

-- Sample Vendor Documents (for vendor ID 31)
INSERT INTO vendor_documents (vendorId, documentName, documentType, filePath, fileSize, mimeType, uploadDate, expiryDate, uploadedBy, notes) VALUES
(31, 'Business Registration Certificate', 'Registration Certificate', '/uploads/vendor-documents/vendor-31-20240101-cert.pdf', 245760, 'application/pdf', '2024-01-15', NULL, 1, 'Valid business registration'),
(31, 'Tax Compliance Certificate', 'Tax Compliance', '/uploads/vendor-documents/vendor-31-20240101-tax.pdf', 189440, 'application/pdf', '2024-01-15', '2024-12-31', 1, 'Valid until end of year'),
(31, 'Product Catalog 2024', 'Product Catalog', '/uploads/vendor-documents/vendor-31-20240101-catalog.pdf', 1048576, 'application/pdf', '2024-01-20', NULL, 1, 'Complete product catalog'),
(31, 'ISO 9001 Certificate', 'ISO Certificate', '/uploads/vendor-documents/vendor-31-20240101-iso.pdf', 321024, 'application/pdf', '2024-01-15', '2026-01-15', 1, 'Quality management certification');

-- Sample Purchase Orders (for vendor ID 31)
INSERT INTO purchase_orders (poNumber, vendorId, orderDate, expectedDeliveryDate, status, subtotal, tax, totalAmount, currency, notes, createdBy) VALUES
('PO-000001', 31, '2024-01-10', '2024-01-25', 'received', 255000.00, 0.00, 255000.00, 'KES', 'Initial IT equipment order', 1),
('PO-000002', 31, '2024-02-15', '2024-03-01', 'partial_received', 180000.00, 0.00, 180000.00, 'KES', 'Network equipment order', 1),
('PO-000003', 31, '2024-03-20', '2024-04-05', 'sent', 130000.00, 0.00, 130000.00, 'KES', 'Office equipment order', 1);

-- Sample Purchase Order Items
INSERT INTO purchase_order_items (purchaseOrderId, itemDescription, quantity, unit, unitPrice, totalPrice, notes) VALUES
-- PO-000001 items
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000001'), 'Laptop Computer - Dell Latitude', 3, 'piece', 85000.00, 255000.00, 'For IT department'),
-- PO-000002 items
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000002'), 'Network Switch - 24 Port', 4, 'piece', 25000.00, 100000.00, 'For network expansion'),
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000002'), 'Wireless Router', 5, 'piece', 12000.00, 60000.00, 'For WiFi coverage'),
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000002'), 'Monitor - 24 inch', 1, 'piece', 18000.00, 18000.00, 'Replacement monitor'),
-- PO-000003 items
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000003'), 'Printer - HP LaserJet', 2, 'piece', 45000.00, 90000.00, 'For admin and reception'),
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000003'), 'Keyboard and Mouse Set', 10, 'set', 3500.00, 35000.00, 'For new workstations'),
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000003'), 'USB Flash Drive - 64GB', 5, 'piece', 2500.00, 12500.00, 'For data backup');

-- Sample data for other vendors (vendor ID 21 - MediSupply Co.)
INSERT INTO vendor_products (vendorId, productCode, productName, category, unit, unitPrice, description, isActive) VALUES
(21, 'MED-001', 'Surgical Gloves - Latex Free', 'Medical Supplies', 'box', 1200.00, 'Box of 100 pairs, powder-free', TRUE),
(21, 'MED-002', 'Disposable Syringes - 5ml', 'Medical Supplies', 'box', 1500.00, 'Box of 100 units, sterile', TRUE),
(21, 'MED-003', 'Surgical Masks - N95', 'Medical Supplies', 'box', 2500.00, 'Box of 50 units', TRUE),
(21, 'MED-004', 'Bandages - Assorted Sizes', 'First Aid', 'pack', 450.00, 'Pack of 20, various sizes', TRUE);

INSERT INTO purchase_orders (poNumber, vendorId, orderDate, expectedDeliveryDate, status, subtotal, tax, totalAmount, currency, notes, createdBy) VALUES
('PO-000004', 21, '2024-01-05', '2024-01-20', 'received', 12500.00, 0.00, 12500.00, 'KES', 'Medical supplies order', 1);

INSERT INTO purchase_order_items (purchaseOrderId, itemDescription, quantity, unit, unitPrice, totalPrice, notes) VALUES
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000004'), 'Surgical Gloves - Latex Free', 5, 'box', 1200.00, 6000.00, 'For surgical procedures'),
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000004'), 'Disposable Syringes - 5ml', 3, 'box', 1500.00, 4500.00, 'For vaccinations'),
((SELECT purchaseOrderId FROM purchase_orders WHERE poNumber = 'PO-000004'), 'Surgical Masks - N95', 2, 'box', 2500.00, 5000.00, 'For staff protection');


