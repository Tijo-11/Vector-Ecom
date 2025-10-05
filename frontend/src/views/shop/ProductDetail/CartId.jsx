export const generateRandomString = () => {
  const length = 30;
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
};

export default function CartId() {
  const userData = localStorage.getItem("userData");
  const userObj = userData ? JSON.parse(userData) : null;

  if (userObj?.user_id) {
    const userCartKey = `cart_id_user_${userObj.user_id}`;
    let userCartId = localStorage.getItem(userCartKey);

    if (!userCartId) {
      // Will be set by CartInitializer after fetching from backend
      userCartId = generateRandomString();
      localStorage.setItem(userCartKey, userCartId);
    }

    return userCartId;
  } else {
    // Anonymous user
    let existingRandomString = localStorage.getItem("random_string");

    if (!existingRandomString) {
      existingRandomString = generateRandomString();
      localStorage.setItem("random_string", existingRandomString);
    }

    return existingRandomString;
  }
}
