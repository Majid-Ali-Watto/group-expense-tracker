export default Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString("en", { month: "long" }));
