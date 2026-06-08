-- Init script: crée la base n8n et la base principale
CREATE DATABASE tritux_n8n;

-- Tables principales dans tritux_rh
\c tritux_rh;

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    cv_original_path VARCHAR(500),
    cv_pdf_path VARCHAR(500),
    profile_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    pdf_preview_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transformations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id),
    output_docx_path VARCHAR(500),
    output_pdf_path VARCHAR(500),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert template par défaut
INSERT INTO templates (name, description, file_path)
VALUES ('Template Tritux', 'Template officiel Tritux', 'templates/templateTritux_.docx')
ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS user_profiles (
    keycloak_id  VARCHAR(255) PRIMARY KEY,   -- sub du JWT Keycloak
    first_name   VARCHAR(255),
    last_name    VARCHAR(255),
    role         VARCHAR(255) DEFAULT 'Responsable RH',
    avatar_path  VARCHAR(500),
    updated_at   TIMESTAMP DEFAULT NOW()
);