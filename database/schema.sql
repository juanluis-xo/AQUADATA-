-- Base de datos para AquaData
CREATE DATABASE IF NOT EXISTS aquadata CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aquadata;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('estudiante', 'profesor') NOT NULL DEFAULT 'estudiante',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de noticias del aula virtual
CREATE TABLE noticias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    autor_id INT NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imagen_url VARCHAR(255),
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de temas del foro
CREATE TABLE temas_foro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    autor_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_limite DATE,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de respuestas del foro
CREATE TABLE respuestas_foro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tema_id INT NOT NULL,
    autor_id INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tema_id) REFERENCES temas_foro(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de encuestas
CREATE TABLE encuestas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    creador_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATE,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de preguntas de encuestas
CREATE TABLE preguntas_encuesta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encuesta_id INT NOT NULL,
    pregunta TEXT NOT NULL,
    tipo ENUM('multiple', 'abierta', 'escala') NOT NULL,
    orden INT NOT NULL,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE
);

-- Tabla de opciones de respuesta
CREATE TABLE opciones_respuesta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta_id INT NOT NULL,
    opcion TEXT NOT NULL,
    orden INT NOT NULL,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_encuesta(id) ON DELETE CASCADE
);

-- Tabla de respuestas de usuarios a encuestas
CREATE TABLE respuestas_encuesta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    encuesta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    respuesta TEXT NOT NULL,
    fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_encuesta(id) ON DELETE CASCADE
);

-- Tabla de retos mensuales
CREATE TABLE retos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    mes VARCHAR(20) NOT NULL,
    anio INT NOT NULL,
    puntos INT DEFAULT 0,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de participación en retos
CREATE TABLE participacion_retos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    estado ENUM('pendiente', 'completado', 'verificado') DEFAULT 'pendiente',
    evidencia TEXT,
    fecha_participacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reto_id) REFERENCES retos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de conversaciones con IA
CREATE TABLE conversaciones_ia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar datos de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES
('Admin', 'Sistema', 'admin@aquadata.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor'),
('María', 'González', 'maria@estudiante.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante');

INSERT INTO noticias (titulo, contenido, autor_id) VALUES
('Bienvenidos a AquaData', 'El Objetivo de Desarrollo Sostenible 6 busca garantizar la disponibilidad y la gestión sostenible del agua y el saneamiento para todas las personas. Esta plataforma te ayudará a aprender y contribuir a este importante objetivo.', 1),
('Importancia del agua limpia', 'El acceso al agua potable es un derecho humano fundamental. Aprende cómo puedes contribuir a su conservación y ayudar a millones de personas que aún no tienen acceso a este recurso vital.', 1),
('Crisis mundial del agua', 'Actualmente, 2.200 millones de personas carecen de acceso a servicios de agua potable gestionados de forma segura. Es fundamental tomar acción ahora para cambiar esta realidad.', 1),
('Saneamiento y salud pública', 'El saneamiento adecuado previene enfermedades y salva vidas. Descubre cómo el ODS 6 trabaja para garantizar servicios de saneamiento para todos.', 1);

INSERT INTO temas_foro (titulo, descripcion, autor_id, fecha_limite) VALUES
('¿Cómo podemos reducir el consumo de agua en casa?', 'Comparte tus ideas y consejos prácticos para ahorrar agua en el hogar. Cada gota cuenta para el futuro del planeta.', 1, '2025-02-28'),
('Tecnologías innovadoras para purificación de agua', 'Discutamos sobre las nuevas tecnologías que están revolucionando el acceso al agua potable en comunidades vulnerables.', 1, '2025-03-15'),
('Impacto de la contaminación en los recursos hídricos', '¿Qué acciones podemos tomar para reducir la contaminación del agua en nuestras comunidades?', 1, '2025-02-20');

INSERT INTO retos (titulo, descripcion, mes, anio, puntos, fecha_inicio, fecha_fin) VALUES
('Ahorro de agua en casa', 'Reduce tu consumo de agua en un 20% durante este mes. Registra tus acciones y comparte tus resultados.', 'Enero', 2025, 100, '2025-01-01', '2025-01-31'),
('Limpieza de cuerpos de agua', 'Organiza o participa en una jornada de limpieza de ríos, lagos o playas en tu comunidad.', 'Febrero', 2025, 150, '2025-02-01', '2025-02-28'),
('Educación sobre el agua', 'Comparte información sobre el ODS 6 con al menos 10 personas y documenta su impacto.', 'Marzo', 2025, 120, '2025-03-01', '2025-03-31');

