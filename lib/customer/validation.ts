const SAUDI_PHONE_PATTERN = /^(\+966|966|0)?5[0-9]{8}$/;

export type ProfileFormInput = {
  fullName: string;
  phone?: string;
};

export type AddressFormInput = {
  label: string;
  recipientName: string;
  phone: string;
  cityRegion: string;
  deliveryAddress: string;
  notes?: string;
  isDefault: boolean;
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateProfileForm(formData: FormData): ValidationResult<ProfileFormInput> {
  const errors: Record<string, string> = {};
  const fullName = getText(formData, "fullName");
  const phone = getText(formData, "phone");

  if (!fullName || fullName.length < 2) {
    errors.fullName = "Enter your full name.";
  }

  if (phone && !SAUDI_PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid Saudi mobile number.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      fullName,
      phone: phone || undefined,
    },
  };
}

export function validateAddressForm(formData: FormData): ValidationResult<AddressFormInput> {
  const errors: Record<string, string> = {};
  const label = getText(formData, "label");
  const recipientName = getText(formData, "recipientName");
  const phone = getText(formData, "phone");
  const cityRegion = getText(formData, "cityRegion");
  const deliveryAddress = getText(formData, "deliveryAddress");
  const notes = getText(formData, "notes");
  const isDefault = formData.get("isDefault") === "on";

  if (!label || label.length < 2) {
    errors.label = "Enter an address label.";
  }

  if (!recipientName || recipientName.length < 2) {
    errors.recipientName = "Enter the recipient name.";
  }

  if (!phone || !SAUDI_PHONE_PATTERN.test(phone)) {
    errors.phone = "Enter a valid Saudi mobile number.";
  }

  if (!cityRegion || cityRegion.length < 2) {
    errors.cityRegion = "Enter the city or region.";
  }

  if (!deliveryAddress || deliveryAddress.length < 8) {
    errors.deliveryAddress = "Enter a complete delivery address.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      label,
      recipientName,
      phone,
      cityRegion,
      deliveryAddress,
      notes: notes || undefined,
      isDefault,
    },
  };
}

export function isSaudiPhone(value: string) {
  return SAUDI_PHONE_PATTERN.test(value);
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}
