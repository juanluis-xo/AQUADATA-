-- Script para insertar datos de ejemplo
-- IMPORTANTE: Ejecutar DESPUÉS del script 01_create_tables.sql

-- Insertar usuarios de ejemplo
-- Contraseña para todos: "password123" (hasheada con password_hash)
INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES
('Juan', 'Pérez', 'profesor@aquadata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor'),
('María', 'González', 'estudiante@aquadata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante'),
('Carlos', 'Rodríguez', 'carlos@aquadata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante');

-- Insertar noticias de ejemplo
INSERT INTO noticias (titulo, contenido, autor_id) VALUES
('Bienvenidos a AquaData', 'Estamos emocionados de lanzar nuestra plataforma educativa sobre el agua y el ODS 6. Aquí encontrarás recursos, foros de discusión y encuestas interactivas.', 1),
('Importancia del Agua Limpia', 'El acceso al agua limpia es un derecho humano fundamental. En esta plataforma aprenderemos sobre su importancia y cómo podemos contribuir a su conservación.', 1);

-- Insertar temas del foro de ejemplo
INSERT INTO temas_foro (titulo, descripcion, autor_id) VALUES
('¿Cómo podemos ahorrar agua en casa?', 'Comparte tus ideas y consejos sobre cómo reducir el consumo de agua en el hogar.', 2),
('Contaminación del agua en nuestra comunidad', 'Discutamos los problemas de contaminación del agua que afectan a nuestras comunidades locales.', 3);

-- Insertar respuestas del foro de ejemplo
INSERT INTO respuestas_foro (tema_id, autor_id, contenido) VALUES
(1, 3, 'Una forma simple es cerrar el grifo mientras te cepillas los dientes. Puede ahorrar hasta 12 litros de agua por día.'),
(1, 1, 'Excelente consejo. También recomiendo instalar aireadores en los grifos para reducir el flujo de agua sin perder presión.');

-- Insertar encuesta de ejemplo
INSERT INTO encuestas (titulo, descripcion, creador_id) VALUES
('Conocimientos Básicos sobre el Agua', 'Evalúa tus conocimientos sobre el agua y el ODS 6', 1);

-- Insertar preguntas de la encuesta
INSERT INTO preguntas_encuesta (encuesta_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden) VALUES
(1, '¿Qué porcentaje de la superficie terrestre está cubierta por agua?', '50%', '71%', '85%', '90%', 'B', 1),
(1, '¿Qué significa ODS 6?', 'Objetivo de Desarrollo Sostenible 6', 'Organización de Desarrollo Social 6', 'Operación de Distribución de Servicios 6', 'Oficina de Desarrollo Sustentable 6', 'A', 2),
(1, '¿Cuál es el principal objetivo del ODS 6?', 'Reducir la contaminación del aire', 'Garantizar agua limpia y saneamiento', 'Promover energías renovables', 'Combatir el cambio climático', 'B', 3);
