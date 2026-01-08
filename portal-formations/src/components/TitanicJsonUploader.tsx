import { useState } from 'react';
import { Upload, FileJson, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface TitanicJsonUploaderProps {
  itemId: string;
  onUploadSuccess: () => void;
  moduleType?: 'big-data' | 'data-science' | 'machine-learning';
}

export function TitanicJsonUploader({ itemId, onUploadSuccess, moduleType }: TitanicJsonUploaderProps) {
  const { user } = useAuth();
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
    if (!file || !user?.id) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Lire le contenu du fichier
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // Valider la structure du JSON
      const isValid = validateTitanicJson(jsonData, moduleType);
      if (!isValid.valid) {
        setError(isValid.error || 'Format JSON invalide');
        setLoading(false);
        return;
      }

      // Sauvegarder dans answer_json de la submission
      const submissionData = {
        user_id: user.id,
        item_id: itemId,
        answer_json: {
          titanicData: jsonData,
          moduleType: moduleType || detectModuleType(jsonData),
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
        },
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
      };

      const { data, error: dbError } = await supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,item_id' })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setSuccess(false);
        onUploadSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Erreur lors de l\'upload:', err);
      setError(`Erreur : ${err.message || 'Une erreur est survenue lors de l\'import'}`);
    } finally {
      setLoading(false);
    }
  };

  const validateTitanicJson = (data: any, moduleType?: string): { valid: boolean; error?: string } => {
    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'Le JSON doit être un objet' };
    }

    const detectedType = moduleType || detectModuleType(data);

    switch (detectedType) {
      case 'big-data':
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
      default:
        return { valid: false, error: 'Type de module non reconnu' };
    }

    return { valid: true };
  };

  const detectModuleType = (data: any): 'big-data' | 'data-science' | 'machine-learning' => {
    if (data['big-data-answers']) return 'big-data';
    if (data['data-science-answers']) return 'data-science';
    if (data.answers || data.predictions) return 'machine-learning';
    return 'big-data'; // Par défaut
  };

  return (
    <div className="titanic-json-uploader">
      <div className="upload-header">
        <FileJson className="upload-icon" size={24} />
        <h3>Importer vos réponses depuis l'application Titanic</h3>
      </div>

      <div className="upload-instructions">
        <p>
          <strong>Instructions :</strong>
        </p>
        <ol>
          <li>
            Exportez vos réponses depuis{' '}
            <a href="https://titaniclearning.netlify.app" target="_blank" rel="noopener noreferrer">
              titaniclearning.netlify.app
            </a>
          </li>
          <li>Cliquez sur "Exporter mes réponses" dans le module correspondant</li>
          <li>Téléchargez le fichier JSON</li>
          <li>Importez-le ici</li>
        </ol>
      </div>

      <div className="upload-area">
        <input
          type="file"
          id="titanic-json-file"
          accept=".json"
          onChange={handleFileSelect}
          className="file-input"
          disabled={loading}
        />
        <label htmlFor="titanic-json-file" className="file-label">
          <Upload className="upload-icon-small" size={20} />
          <span>{file ? file.name : 'Sélectionner un fichier JSON'}</span>
        </label>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle className="error-icon" size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message">
          <CheckCircle className="success-icon" size={20} />
          <span>Fichier importé avec succès ! Vos réponses sont maintenant disponibles pour votre formateur.</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="upload-button"
      >
        {loading ? (
          <>
            <Loader className="spinner" size={16} />
            <span>Import en cours...</span>
          </>
        ) : (
          'Importer les réponses'
        )}
      </button>
    </div>
  );
}
