type ComboOption = {
  label: string;
  value: string;
};

type ComboboxProps = {
  label?: string;
  placeholder?: string;
  value: string | null;
  options: ComboOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};
