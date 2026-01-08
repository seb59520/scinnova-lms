import { useState } from 'react';
import { Upload, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import './TitanicJsonUploader.css';

interface TitanicJsonUploaderProps {
  onUpload: (data: any) => void;
  moduleType: 'big-data' | 'data-science' | 'machine-learning';
}

export function TitanicJsonUploader({ onUpload, moduleType }: TitanicJsonUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setError('Le fichier doit être au format JSON (.json)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Valider la structure du JSON selon le module
      const isValid = validateTitanicJson(jsonData, moduleType);
      if (!isValid.valid) {
        setError(isValid.error || 'Format JSON invalide');
        setLoading(false);
        return;
      }

      // Ajouter les métadonnées
      const enrichedData = {
        ...jsonData,
        metadata: {
          moduleType,
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
        },
      };

      onUpload(enrichedData);
      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(`Erreur lors de la lecture du fichier : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateTitanicJson = (data: any, moduleType: string): { valid: boolean; error?: string } => {
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'Le JSON doit être un objet' };
    }

    switch (moduleType) {
      case 'big-data':
        // Vérifier la présence de réponses pour Big Data
        if (!data['big-data-answers'] && Object.keys(data).length === 0) {
          return { valid: false, error: 'Aucune réponse trouvée pour le module Big Data' };
        }
        break;
      case 'data-science':
        if (!data['data-science-answers'] && Object.keys(data).length === 0) {
          return { valid: false, error: 'Aucune réponse trouvée pour le module Data Science' };
        }
        break;
      case 'machine-learning':
        if (!data.answers && !data.predictions && Object.keys(data).length === 0) {
          return { valid: false, error: 'Aucune réponse ou prédiction trouvée pour le module Machine Learning' };
        }
        break;
    }

    return { valid: true };
  };

  return (
    <div className="titanic-json-uploader">
      <div className="upload-header">
        <FileJson className="upload-icon" />
        <h3>Importer vos réponses depuis l'application Titanic</h3>
      </div>

      <div className="upload-instructions">
        <p>
          1. Exportez vos réponses depuis l'application{' '}
          <a href="https://titaniclearning.netlify.app" target="_blank" rel="noopener noreferrer">
            titaniclearning.netlify.app
          </a>
        </p>
        <p>2. Cliquez sur "Exporter mes réponses" dans le module {moduleType}</p>
        <p>3. Téléchargez le fichier JSON</p>
        <p>4. Importez-le ici</p>
      </div>

      <div className="upload-area">
        <input
          type="file"
          id="titanic-json-file"
          accept=".json"
          onChange={handleFileSelect}
          className="file-input"
        />
        <label htmlFor="titanic-json-file" className="file-label">
          <Upload className="upload-icon-small" />
          {file ? file.name : 'Sélectionner un fichier JSON'}
        </label>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message">
          <CheckCircle className="success-icon" />
          <span>Fichier importé avec succès !</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="upload-button"
      >
        {loading ? 'Import en cours...' : 'Importer les réponses'}
      </button>
    </div>
  );
}
