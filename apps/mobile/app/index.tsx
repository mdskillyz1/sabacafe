import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { businessInfo, calculatePrice, menuCategories, menuItems, money, type CartLine, type FulfilmentType, type MenuItem } from "@saba/shared";

const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function AppHome() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>("PICKUP");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const totals = useMemo(() => calculatePrice(cart, menuItems, fulfilmentType, "SABA10"), [cart, fulfilmentType]);

  function addItem(item: MenuItem) {
    setCart((current) => [
      ...current,
      { menuItemId: item.id, name: item.name, unitPricePence: item.pricePence, quantity: 1, optionIds: [], addOnIds: [] }
    ]);
  }

  async function checkout() {
    const response = await fetch(`${apiBase}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        email,
        phone,
        fulfilmentType,
        postcode,
        promoCode: "SABA10",
        items: cart
      })
    });
    const order = await response.json();
    if (!response.ok) {
      Alert.alert("Order issue", order.error ?? "Please check your basket.");
      return;
    }
    await fetch(`${apiBase}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id })
    });
    Alert.alert("Order received", `Reference ${order.orderNumber}. Push notification hooks are ready for status updates.`);
    setCart([]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Saba Cafe mobile</Text>
        <Text style={styles.title}>Order Somali favourites, save addresses, earn rewards.</Text>
        <Text style={styles.copy}>
          {businessInfo.formattedAddress} • {businessInfo.googleRating.toFixed(1)} Google rating • {businessInfo.phone}
        </Text>
      </View>

      <View style={styles.segment}>
        {(["PICKUP", "DELIVERY"] as FulfilmentType[]).map((type) => (
          <Pressable key={type} onPress={() => setFulfilmentType(type)} style={[styles.segmentButton, fulfilmentType === type && styles.segmentActive]}>
            <Text style={[styles.segmentText, fulfilmentType === type && styles.segmentTextActive]}>{type}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Menu</Text>
      {menuCategories.map((category) => {
        const items = menuItems.filter((item) => item.categoryId === category.id);
        if (!items.length) return null;
        return (
          <View key={category.id}>
            <Text style={styles.category}>{category.name}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.image} />
                <View style={styles.cardBody}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCopy}>{item.description}</Text>
                  <View style={styles.row}>
                    <Text style={styles.price}>{money(item.pricePence)}</Text>
                    <Pressable onPress={() => addItem(item)} style={styles.button}><Text style={styles.buttonText}>Add</Text></Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      })}

      <View style={styles.checkout}>
        <Text style={styles.sectionTitle}>Checkout</Text>
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
        {fulfilmentType === "DELIVERY" ? <TextInput placeholder="Postcode" value={postcode} onChangeText={setPostcode} style={styles.input} /> : null}
        <Text style={styles.total}>{cart.length} items • {money(totals.totalPence)}</Text>
        <Pressable onPress={checkout} style={styles.payButton}><Text style={styles.payButtonText}>Pay with Stripe-ready checkout</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 18 },
  hero: { backgroundColor: "#3B2118", borderRadius: 8, padding: 22 },
  kicker: { color: "#D9902A", fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: "#FFF7EA", fontSize: 34, fontWeight: "800", marginTop: 10 },
  copy: { color: "rgba(255,247,234,0.75)", lineHeight: 22, marginTop: 10 },
  segment: { flexDirection: "row", gap: 8 },
  segmentButton: { flex: 1, borderWidth: 1, borderColor: "rgba(59,33,24,0.16)", borderRadius: 8, padding: 14, alignItems: "center" },
  segmentActive: { backgroundColor: "#1E7A68" },
  segmentText: { color: "#3B2118", fontWeight: "800" },
  segmentTextActive: { color: "#FFF7EA" },
  sectionTitle: { color: "#3B2118", fontSize: 28, fontWeight: "800" },
  category: { color: "#9A4E2D", fontWeight: "800", marginTop: 8, marginBottom: 8 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 8, overflow: "hidden", marginBottom: 14, borderWidth: 1, borderColor: "rgba(59,33,24,0.1)" },
  image: { height: 130, backgroundColor: "#D9902A" },
  cardBody: { padding: 14 },
  itemName: { color: "#3B2118", fontSize: 20, fontWeight: "800" },
  itemCopy: { color: "rgba(59,33,24,0.68)", marginTop: 6, lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  price: { color: "#9A4E2D", fontWeight: "800" },
  button: { backgroundColor: "#3B2118", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  buttonText: { color: "#FFF7EA", fontWeight: "800" },
  checkout: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 16, gap: 10 },
  input: { borderWidth: 1, borderColor: "rgba(59,33,24,0.16)", borderRadius: 8, padding: 14 },
  total: { color: "#3B2118", fontWeight: "800", fontSize: 18 },
  payButton: { backgroundColor: "#1E7A68", borderRadius: 999, padding: 16, alignItems: "center" },
  payButtonText: { color: "#FFFFFF", fontWeight: "800" }
});
