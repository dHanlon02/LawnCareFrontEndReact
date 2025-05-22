import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const animatedCardStyle = (index: number) => ({
    transform: [
      {
        scale: scrollY.interpolate({
          inputRange: [index * 150, index * 150 + 150],
          outputRange: [0.95, 1],
          extrapolate: 'clamp',
        }),
      },
    ],
    opacity: scrollY.interpolate({
      inputRange: [index * 150, index * 150 + 150],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    }),
  });

  const handleFooterNavigation = (item: string) => {
    switch (item) {
      case 'My Lawn':
        
        navigation.navigate('CustomerDashboard');
        break;
      case 'My Photos':
        navigation.navigate('UploadPhotoScreen');
        break;
      case 'My Bookings':
        navigation.navigate('CustomerAppointments');
        break;
      case 'More...':
        navigation.navigate('MoreOptions')
        break;
      default:
        break;
    }
  };

  const cards = [
    {
      title: 'Scarifying',
      subtitle:
        "Scarifying is a process that involves scratching or abrading a surface to remove dead material, improve water absorption, and stimulate growth. In gardening, it’s used to break seed dormancy and refresh lawns by cutting through thatch.",
      image:
        'https://thgroundcare.co.uk/wp-content/uploads/2020/01/scarifying0002-400x400.jpg',
    },
    {
      title: 'Mowing for Lawn Health',
      subtitle:
        "Regular mowing promotes denser growth and prevents weeds from taking over. Set your mower to a higher setting to maintain healthy grass and avoid cutting off more than one-third of the blade length.",
      image:
        'https://showcaselawnworks.com/wp-content/uploads/2024/04/mowing-cropped-400-x-400.jpg',
    },
    {
      title: 'Deep Watering',
      subtitle:
        "Water deeply early in the morning to encourage roots to grow deeper into the soil. This method helps maintain moisture, improves drought resistance, and supports overall turf health.",
      image:
        'https://irp-cdn.multiscreensite.com/06164b2d/Sprinkler-System-400.jpg',
    },
    {
      title: 'Weed Control',
      subtitle:
        "Prevent weeds by maintaining a healthy, dense lawn. Regular soil testing and appropriate fertilization reduce stress on grass, giving it a better chance to crowd out unwanted plants.",
      image:
        'https://www.vidaxl.co.uk/dw/image/v2/BFNS_PRD/on/demandware.static/-/Sites-vidaxl-catalog-master-sku/default/dw20e7a150/hi-res/536/689/2962/6381/446386/image_4_446386.jpg?sw=400',
    },
    {
      title: 'Aerate & Overseed',
      subtitle:
        "Aerate your lawn annually to relieve soil compaction and allow nutrients to reach the roots. Follow up with overseeding to fill in bare patches and encourage a lush, green lawn.",
      image:
        'https://acculawn.net/wp-content/uploads/2021/07/overseeding.png',
    },
    {
      title: 'Fertilizing',
      subtitle:
        "Apply fertilizer at the right times of year to provide essential nutrients that boost grass growth and overall lawn health. Use slow-release formulas to avoid burning your turf.",
      image:
        'https://www.inscapes.org.uk/cdn/shop/products/Fertiliser_20KG_2_400x.png?v=1730973361',
    },
    {
      title: 'Rake & Mulch Leaves',
      subtitle:
        "Regularly rake fallen leaves to prevent them from forming a thick layer that can smother your lawn. Mulching these leaves with your mower returns valuable nutrients to the soil.",
      image:
        'https://www.ruxley-manor.co.uk/shop/gallery/70100062-1-thumbnail.jpg',
    },
    {
      title: 'Compost Leaves',
      subtitle:
        "Collect excess leaves and add them to your compost pile. This practice creates nutrient-rich compost that improves soil structure, supports healthy grass growth, and reduces landfill waste.",
      image:
        'https://www.gardenhealth.com/wp-content/uploads/2018/05/leaf-mould-2.webp',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Home</Text>
      </View>

      <Animated.ScrollView
        style={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Text style={styles.welcomeText}>
          Welcome back, {user?.name || 'User'}
        </Text>
        {cards.map((item, index) => (
          <Animated.View key={index} style={[styles.card, animatedCardStyle(index)]}>
            <Image style={styles.cardImage} source={{ uri: item.image }} />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </Animated.View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        {['My Lawn', 'My Photos', 'My Bookings', 'More...'].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.footerItem}
            activeOpacity={0.7}
            onPress={() => handleFooterNavigation(item)}
          >
            <Text style={styles.footerItemText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default CustomerDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  topBar: {
    backgroundColor: '#388E3C',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#424242',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginHorizontal: 8,
    color: '#4CAF50',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginHorizontal: 8,
    color: '#BDBDBD',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#388E3C',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  footerItem: {
    paddingHorizontal: 5,
  },
  footerItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
