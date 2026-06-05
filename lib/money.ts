export function formatSar(amountHalalas: number) {
  const isNegative = amountHalalas < 0;
  const absoluteAmount = Math.abs(amountHalalas);
  const riyals = Math.trunc(absoluteAmount / 100);
  const halalas = absoluteAmount % 100;
  const formattedRiyals = new Intl.NumberFormat("en-SA").format(riyals);
  const formattedHalalas = halalas.toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}SAR ${formattedRiyals}${
    halalas > 0 ? `.${formattedHalalas}` : ""
  }`;
}

export function calculateDiscountPercent(
  priceHalalas: number,
  compareAtPriceHalalas?: number,
) {
  if (!compareAtPriceHalalas || compareAtPriceHalalas <= priceHalalas) {
    return null;
  }

  return Math.round(
    ((compareAtPriceHalalas - priceHalalas) * 100) / compareAtPriceHalalas,
  );
}
