export const convert2StandardPhoneNumber = (phoneNumber: string) => {
  const digits = phoneNumber.split("").filter(ch => ch >= '0' && ch <= '9');
  if (digits.length !== 10)
    return '';
  return digits.slice(0, 3).join('') + ' ' + digits.slice(3, 6).join('') + ' ' + digits.slice(6, 10).join('');
};