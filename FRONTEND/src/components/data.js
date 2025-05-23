// import apple from "/src/assets/apple.png";
import apple from '../assets/apple.png';
import bread from "../assets/bread.png";
import milk from "../assets/milk.png";
import eggs from "../assets/eggs.png";
import honey from "../assets/honey.png";
import soap from "../assets/soap.png";



const mockProducts = [
  {
    id: 1,
    name: "Fresh Apples",
    vendor: "Local Orchard",
    price: 2.99,
    image: apple,
    description:
      "Crisp and juicy Red Delicious apples, hand-picked from our local orchard. Perfect for snacking, baking, or making delicious cider.",
    category: "Fruits",
    originalPrice: 3.50,
  },
  {
    id: 2,
    name: "Artisan Bread",
    vendor: "The Bakery",
    price: 4.5,
    image: bread,
    description:
      "A freshly baked sourdough loaf, made with organic flour and a traditional starter. Its crusty exterior and soft, chewy interior make it a perfect accompaniment to any meal.",
    category: "Bakery",
    originalPrice: 5.00,


  },
  {
    id: 3,
    name: "Organic Milk",
    vendor: "Dairy Farms",
    price: 3.2,
    image:  milk ,
    description:
      "Whole milk from grass-fed cows, rich in nutrients and with a creamy, natural flavor. Perfect for your morning coffee or cereal.",
    category: "Dairy & Eggs",
    originalPrice: 3.50,
  },
  {
    id: 4,
    name: "Free-Range Eggs",
    vendor: "Happy Hen Farms",
    price: 5.50,
    image:  eggs ,
    description:
      "A dozen large, brown eggs from hens that roam freely on pasture. These eggs have rich yolks and superior flavor, perfect for any recipe.",
    category: "Dairy & Eggs",
    originalPrice: 5.50,  

  },
  {
    id: 5,
    name: "Wildflower Honey",
    vendor: "Buzzing Bees",
    price: 8.00,
    image:  honey ,
    description:
      "Raw, unfiltered honey collected from wildflowers in the local meadows. This honey has a complex, floral sweetness and is packed with antioxidants.",
    category: "Honey",
    originalPrice: 9.00,
  },
  {
    id: 6,
    name: "Handmade Soap",
    vendor: "Soapy Suds",
    price: 6.75,
    image:  soap ,
    description:
      "A fragrant bar of lavender soap, handmade with natural oils and butters. This soap is gentle on the skin and leaves you feeling refreshed.",
    category: 'soap & detergents',
    originalPrice: 7.50,
  },
  // ... more products
];

export default mockProducts;