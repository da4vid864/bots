import { useState, ChangeEvent, FormEvent } from 'react';

interface ValidationRules {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  pattern?: RegExp;
}

interface UseFormValidationProps<T> {
  initialValues: T;
  validations?: Partial<Record<keyof T, ValidationRules>>;
  onSubmit?: (values: T) => Promise<void> | void;
}

export const useFormValidation = <T extends Record<string, any>>({
  initialValues,
  validations = {},
  onSubmit,
}: UseFormValidationProps<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (fieldValues: T): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    // Robust email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    Object.keys(validations).forEach((key) => {
      const rule = validations[key as keyof T];
      const value = fieldValues[key as keyof T];

      if (rule?.required && !value) {
        newErrors[key as keyof T] = 'This field is required';
        isValid = false;
      } else if (rule?.email && typeof value === 'string' && !emailRegex.test(value)) {
        newErrors[key as keyof T] = 'Please enter a valid email address';
        isValid = false;
      } else if (rule?.minLength && typeof value === 'string' && value.length < rule.minLength) {
        newErrors[key as keyof T] = `Must be at least ${rule.minLength} characters`;
        isValid = false;
      } else if (rule?.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        newErrors[key as keyof T] = 'Invalid format';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field being edited
    if (errors[name as keyof T]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);

    if (validate(values)) {
      try {
        if (onSubmit) {
          await onSubmit(values);
        } else {
          // Simulate async submission if no onSubmit provided
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        setIsSuccess(true);
        setValues(initialValues);
      } catch (error) {
        console.error('Submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
    isSuccess,
  };
};