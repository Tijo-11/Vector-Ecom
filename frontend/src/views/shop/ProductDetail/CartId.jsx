export default function CartId() {
  const generateRandomString = () => {
    const length = 30;
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let randomString = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters[randomIndex];
    }

    localStorage.setItem("random_string", randomString);
    return randomString;
  };

  const existingRandomString = localStorage.getItem("random_string");

  if (!existingRandomString) {
    return generateRandomString();
  }

  return existingRandomString;
}
