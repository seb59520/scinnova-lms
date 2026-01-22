import React, { useState, useEffect } from 'react';
import type { EvaluationQuestion, EvaluationQuestionType } from '../../types/database';
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  Circle,
  Code,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';

interface EvaluationQuestionEditorProps {
  question?: EvaluationQuestion;
  onSave: (question: EvaluationQuestion) => void;
  onCancel: () => void;
  questionNumber?: number;
}

const QUESTION_TYPES: { value: EvaluationQuestionType; label: string; icon: React.ReactNode }[] = [
  { value: 'multiple_choice', label: 'Choix multiple', icon: <CheckCircle className="w-4 h-4" /> },
  { value: 'true_false', label: 'Vrai/Faux', icon: <Circle className="w-4 h-4" /> },
  { value: 'text', label: 'Réponse texte', icon: <FileText className="w-4 h-4" /> },
  { value: 'code', label: 'Code', icon: <Code className="w-4 h-4" /> }
];

export function EvaluationQuestionEditor({
  question,
  onSave,
  onCancel,
  questionNumber = 1
}: EvaluationQuestionEditorProps) {
  const [formData, setFormData] = useState<Partial<EvaluationQuestion>>({
    id: question?.id || crypto.randomUUID(),
    question: question?.question || '',
    type: question?.type || 'multiple_choice',
    options: question?.options || ['', '', '', ''],
    correct_answer: question?.correct_answer || '',
    points: question?.points || 1,
    explanation: question?.explanation || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Si on passe à vrai/faux, définir les options par défaut
    if (formData.type === 'true_false' && formData.options?.length !== 2) {
      setFormData(prev => ({
        ...prev,
        options: ['Vrai', 'Faux']
      }));
    }
  }, [formData.type]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question?.trim()) {
      newErrors.question = 'La question est requise';
    }

    if (!formData.points || formData.points < 1) {
      newErrors.points = 'Les points doivent être >= 1';
    }

    if (formData.type === 'multiple_choice' || formData.type === 'true_false') {
      if (!formData.correct_answer?.trim()) {
        newErrors.correct_answer = 'La réponse correcte est requise';
      }

      const validOptions = formData.options?.filter(o => o.trim()) || [];
      if (validOptions.length < 2) {
        newErrors.options = 'Au moins 2 options sont requises';
      }

      if (formData.correct_answer && !validOptions.includes(formData.correct_answer)) {
        newErrors.correct_answer = 'La réponse correcte doit être l\'une des options';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Nettoyer les options vides
    const cleanedOptions = formData.options?.filter(o => o.trim()) || [];

    onSave({
      id: formData.id!,
      question: formData.question!,
      type: formData.type!,
      options: cleanedOptions.length > 0 ? cleanedOptions : undefined,
      correct_answer: formData.correct_answer || undefined,
      points: formData.points!,
      explanation: formData.explanation || undefined
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((o, i) => i === index ? value : o)
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
          <span className="font-medium text-gray-700">Question {questionNumber}</span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Type de question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de question
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {type.icon}
                <span className="text-sm">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question *
          </label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.question ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Saisissez votre question ici..."
          />
          {errors.question && (
            <p className="mt-1 text-sm text-red-600">{errors.question}</p>
          )}
        </div>

        {/* Options (pour MCQ et Vrai/Faux) */}
        {(formData.type === 'multiple_choice' || formData.type === 'true_false') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options de réponse *
            </label>
            <div className="space-y-2">
              {formData.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={formData.correct_answer === option && option.trim() !== ''}
                    onChange={() => setFormData(prev => ({ ...prev, correct_answer: option }))}
                    className="w-4 h-4 text-blue-600"
                    disabled={!option.trim()}
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    disabled={formData.type === 'true_false'}
                  />
                  {formData.type === 'multiple_choice' && formData.options!.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {formData.type === 'multiple_choice' && formData.options!.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une option
                </button>
              )}
            </div>
            {errors.options && (
              <p className="mt-1 text-sm text-red-600">{errors.options}</p>
            )}
            {errors.correct_answer && (
              <p className="mt-1 text-sm text-red-600">{errors.correct_answer}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Sélectionnez le bouton radio à côté de la bonne réponse
            </p>
          </div>
        )}

        {/* Réponse attendue (pour texte et code) */}
        {(formData.type === 'text' || formData.type === 'code') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Réponse attendue (pour correction manuelle)
            </label>
            <textarea
              value={formData.correct_answer}
              onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
              rows={formData.type === 'code' ? 5 : 2}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formData.type === 'code' ? 'font-mono text-sm' : ''
              }`}
              placeholder={
                formData.type === 'code'
                  ? '// Exemple de code attendu...'
                  : 'Réponse attendue pour référence...'
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Cette réponse servira de référence pour la correction manuelle
            </p>
          </div>
        )}

        {/* Points et explication */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points *
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={formData.points ?? 1}
              onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.points ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.points && (
              <p className="mt-1 text-sm text-red-600">{errors.points}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-1">
                Explication
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
            </label>
            <input
              type="text"
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Explication affichée après réponse"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {question ? 'Mettre à jour' : 'Ajouter la question'}
        </button>
      </div>
    </div>
  );
}
