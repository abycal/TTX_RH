from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Union


class Education(BaseModel):
    year: Optional[str] = ""
    degree: str = "Inconnu"
    school: str = "Inconnu"

    @field_validator("year", mode="before")
    @classmethod
    def normalize_year(cls, v):
        if v is None:
            return ""
        return str(v)


class Language(BaseModel):
    name: str = "Inconnu"
    level: str = "Inconnu"


class Experience(BaseModel):
    company: str = "N/A"
    position: Optional[str] = None
    start_date: str = ""
    end_date: Optional[str] = None
    description: str = ""
    tech_stack: Optional[str] = None
    # achievements accepte string OU liste — normalisé en liste par le validator
    achievements: Optional[Union[List[str], str]] = []

    @field_validator("achievements", mode="before")
    @classmethod
    def normalize_achievements(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        if isinstance(v, list):
            return [str(a) for a in v if a is not None]
        return []

    @field_validator("tech_stack", mode="before")
    @classmethod
    def normalize_tech_stack(cls, v):
        if isinstance(v, list):
            return ", ".join(str(t) for t in v if t)
        return v


class CandidateProfile(BaseModel):
    nom_candidat: str = "Inconnu"
    title: Optional[str] = "Candidat"
    experience_years: Optional[str] = None
    skills: List[str] = []
    specific_skills: List[str] = []
    education: List[Education] = []
    languages: List[Language] = []
    experiences: List[Experience] = []

    @field_validator("experience_years", mode="before")
    @classmethod
    def normalize_experience_years(cls, v):
        if v is None:
            return None
        return str(v)

    @field_validator("skills", "specific_skills", mode="before")
    @classmethod
    def normalize_string_lists(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v] if v.strip() else []
        if isinstance(v, list):
            return [str(s) for s in v if s is not None]
        return []


# Schéma JSON pour le prompt Groq (utilisé dans n8n)
GEMINI_JSON_SCHEMA = {
    "nom_candidat": "string - Prénom et Nom complet",
    "title": "string - Titre / Poste actuel ou souhaité",
    "experience_years": "integer - Nombre d'années d'expérience totale (null si inconnu)",
    "skills": ["liste de compétences techniques générales (ex: Python, React, Docker)"],
    "specific_skills": ["liste de compétences spécifiques métier (ex: Scrum Master, CI/CD)"],
    "education": [
        {
            "year": "string - Année d'obtention (ex: 2020)",
            "degree": "string - Diplôme obtenu",
            "school": "string - Nom de l'établissement"
        }
    ],
    "languages": [
        {
            "name": "string - Nom de la langue",
            "level": "string - Niveau (ex: Courant, Natif, Intermédiaire, B2)"
        }
    ],
    "experiences": [
        {
            "company": "string - Nom de l'entreprise",
            "position": "string - Intitulé du poste",
            "start_date": "string - Date de début (ex: Jan 2022)",
            "end_date": "string ou null si poste actuel",
            "description": "string - Description de la mission",
            "tech_stack": "string - Technologies utilisées séparées par des virgules",
            "achievements": ["liste de réalisations concrètes - TOUJOURS une liste, jamais une string"]
        }
    ]
}