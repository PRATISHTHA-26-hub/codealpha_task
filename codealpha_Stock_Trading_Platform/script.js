
import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

class Stock implements Serializable {
    private String symbol;
    private String name;
    private double price;

    public Stock(String symbol, String name, double price) {
        this.symbol = symbol;
        this.name = name;
        this.price = price;
    }

    public String getSymbol() { return symbol; }
    public String getName() { return name; }
    public double getPrice() { return price; }

    public void setPrice(double price) {
        this.price = price;
    }

    public void display() {
        System.out.printf("%-10s %-20s Rs. %.2f%n",
                symbol, name, price);
    }
}

class Transaction implements Serializable {
    String type;
    String symbol;
    int quantity;
    double price;
    String date;

    public Transaction(String type, String symbol,
                       int quantity, double price) {
        this.type = type;
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.date = LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"));
    }

    public void display() {
        System.out.printf("%-8s %-10s %-8d Rs. %-10.2f %s%n",
                type, symbol, quantity, price, date);
    }
}

class User implements Serializable {
    String name;
    double balance;
    Map<String, Integer> portfolio = new HashMap<>();
    Map<String, Double> averagePrice = new HashMap<>();
    List<Transaction> history = new ArrayList<>();
    List<Double> performance = new ArrayList<>();

    public User(String name, double balance) {
        this.name = name;
        this.balance = balance;
    }

    public void buyStock(Stock stock, int quantity) {
        if (quantity <= 0) {
            System.out.println("Invalid quantity!");
            return;
        }

        double cost = stock.getPrice() * quantity;

        if (cost > balance) {
            System.out.println("Insufficient balance!");
            return;
        }

        int oldQuantity = portfolio.getOrDefault(
                stock.getSymbol(), 0);

        double oldInvestment =
                averagePrice.getOrDefault(stock.getSymbol(), 0.0)
                * oldQuantity;

        double newAverage =
                (oldInvestment + cost) / (oldQuantity + quantity);

        balance -= cost;
        portfolio.put(stock.getSymbol(), oldQuantity + quantity);
        averagePrice.put(stock.getSymbol(), newAverage);

        history.add(new Transaction("BUY",
                stock.getSymbol(), quantity, stock.getPrice()));

        System.out.println("Stock purchased successfully!");
    }

    public void sellStock(Stock stock, int quantity) {
        if (quantity <= 0) {
            System.out.println("Invalid quantity!");
            return;
        }

        int owned = portfolio.getOrDefault(
                stock.getSymbol(), 0);

        if (owned < quantity) {
            System.out.println("Not enough shares!");
            return;
        }

        balance += stock.getPrice() * quantity;

        int remaining = owned - quantity;

        if (remaining == 0) {
            portfolio.remove(stock.getSymbol());
            averagePrice.remove(stock.getSymbol());
        } else {
            portfolio.put(stock.getSymbol(), remaining);
        }

        history.add(new Transaction("SELL",
                stock.getSymbol(), quantity, stock.getPrice()));

        System.out.println("Stock sold successfully!");
    }

    public void showPortfolio(Map<String, Stock> market) {
        double investment = 0;
        double marketValue = 0;

        System.out.println("\n----- YOUR PORTFOLIO -----");
        System.out.printf("%-10s %-10s %-15s %-15s%n",
                "Stock", "Quantity", "Avg. Price", "Current Price");

        for (String symbol : portfolio.keySet()) {
            Stock stock = market.get(symbol);
            int quantity = portfolio.get(symbol);
            double avg = averagePrice.get(symbol);

            investment += avg * quantity;
            marketValue += stock.getPrice() * quantity;

            System.out.printf("%-10s %-10d Rs. %-11.2f Rs. %-11.2f%n",
                    symbol, quantity, avg, stock.getPrice());
        }

        double profitLoss = marketValue - investment;

        System.out.printf("\nCash Balance: Rs. %.2f%n", balance);
        System.out.printf("Investment: Rs. %.2f%n", investment);
        System.out.printf("Market Value: Rs. %.2f%n", marketValue);
        System.out.printf("Profit/Loss: Rs. %.2f%n", profitLoss);

        performance.add(balance + marketValue);
    }

    public void showHistory() {
        System.out.println("\n----- TRANSACTION HISTORY -----");

        for (Transaction t : history) {
            t.display();
        }

        if (history.isEmpty()) {
            System.out.println("No transactions yet.");
        }
    }
}

class StockMarket implements Serializable {
    Map<String, Stock> stocks = new LinkedHashMap<>();

    public StockMarket() {
        stocks.put("TCS", new Stock("TCS", "Tata Consultancy", 3850));
        stocks.put("INFY", new Stock("INFY", "Infosys", 1800));
        stocks.put("RELIANCE", new Stock("RELIANCE", "Reliance", 2900));
        stocks.put("HDFC", new Stock("HDFC", "HDFC Bank", 1650));
        stocks.put("ITC", new Stock("ITC", "ITC Limited", 450));
    }

    public void displayMarket() {
        System.out.println("\n----- STOCK MARKET -----");
        System.out.printf("%-10s %-20s %s%n",
                "Symbol", "Company", "Price");

        for (Stock stock : stocks.values()) {
            stock.display();
        }
    }

    public Stock getStock(String symbol) {
        return stocks.get(symbol.toUpperCase());
    }

    public void updatePrice(String symbol, double price) {
        Stock stock = getStock(symbol);

        if (stock == null || price <= 0) {
            System.out.println("Invalid stock or price!");
            return;
        }

        stock.setPrice(price);
        System.out.println("Stock price updated successfully!");
    }
}

public class Main {

    static final String FILE_NAME = "trading_data.dat";

    static void saveData(User user, StockMarket market) {
        try (ObjectOutputStream out =
                     new ObjectOutputStream(
                             new FileOutputStream(FILE_NAME))) {
            out.writeObject(user);
            out.writeObject(market);
            System.out.println("Data saved successfully!");
        } catch (IOException e) {
            System.out.println("Error saving data: " + e.getMessage());
        }
    }

    static Object[] loadData() {
        File file = new File(FILE_NAME);

        if (!file.exists()) return null;

        try (ObjectInputStream in =
                     new ObjectInputStream(
                             new FileInputStream(FILE_NAME))) {
            User user = (User) in.readObject();
            StockMarket market = (StockMarket) in.readObject();

            return new Object[]{user, market};

        } catch (IOException | ClassNotFoundException e) {
            System.out.println("Could not load saved data.");
            return null;
        }
    }

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        Object[] saved = loadData();

        User user;
        StockMarket market;

        if (saved != null) {
            user = (User) saved[0];
            market = (StockMarket) saved[1];
            System.out.println("Welcome back, " + user.name);
        } else {
            System.out.print("Enter your name: ");
            String name = sc.nextLine();

            user = new User(name, 100000);
            market = new StockMarket();
        }

        int choice = 0;

        do {
            System.out.println("\n================================");
            System.out.println("      STOCK TRADING PLATFORM");
            System.out.println("================================");
            System.out.println("1. View Market Data");
            System.out.println("2. Buy Stocks");
            System.out.println("3. Sell Stocks");
            System.out.println("4. View Portfolio");
            System.out.println("5. Transaction History");
            System.out.println("6. Portfolio Performance");
            System.out.println("7. Update Stock Price");
            System.out.println("8. Save and Exit");
            System.out.print("Enter your choice: ");

            if (!sc.hasNextInt()) {
                System.out.println("Enter a valid number!");
                sc.nextLine();
                continue;
            }

            choice = sc.nextInt();

            switch (choice) {

                case 1:
                    market.displayMarket();
                    break;

                case 2:
                    market.displayMarket();
                    System.out.print("Enter stock symbol: ");
                    String buySymbol = sc.next().toUpperCase();

                    Stock buyStock = market.getStock(buySymbol);

                    if (buyStock == null) {
                        System.out.println("Stock not found!");
                        break;
                    }

                    System.out.print("Enter quantity: ");

                    if (!sc.hasNextInt()) {
                        System.out.println("Invalid quantity!");
                        sc.next();
                        break;
                    }

                    int buyQty = sc.nextInt();
                    user.buyStock(buyStock, buyQty);
                    break;

                case 3:
                    market.displayMarket();
                    System.out.print("Enter stock symbol: ");
                    String sellSymbol = sc.next().toUpperCase();

                    Stock sellStock = market.getStock(sellSymbol);

                    if (sellStock == null) {
                        System.out.println("Stock not found!");
                        break;
                    }

                    System.out.print("Enter quantity: ");

                    if (!sc.hasNextInt()) {
                        System.out.println("Invalid quantity!");
                        sc.next();
                        break;
                    }

                    int sellQty = sc.nextInt();
                    user.sellStock(sellStock, sellQty);
                    break;

                case 4:
                    user.showPortfolio(market.stocks);
                    break;

                case 5:
                    user.showHistory();
                    break;

                case 6:
                    user.showPortfolio(market.stocks);

                    System.out.println("\n----- PERFORMANCE HISTORY -----");

                    for (int i = 0; i < user.performance.size(); i++) {
                        System.out.printf("Snapshot %d: Rs. %.2f%n",
                                i + 1, user.performance.get(i));
                    }
                    break;

                case 7:
                    market.displayMarket();

                    System.out.print("Enter stock symbol: ");
                    String symbol = sc.next().toUpperCase();

                    System.out.print("Enter new price: ");

                    if (!sc.hasNextDouble()) {
                        System.out.println("Invalid price!");
                        sc.next();
                        break;
                    }

                    double price = sc.nextDouble();
                    market.updatePrice(symbol, price);
                    break;

                case 8:
                    saveData(user, market);
                    System.out.println("Thank you for using the platform!");
                    break;

                default:
                    System.out.println("Invalid choice! Try again.");
            }

        } while (choice != 8);

        sc.close();
    }
}
