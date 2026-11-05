
import java.io.*;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

enum RoomCategory {
    STANDARD(2000.0),
    DELUXE(3500.0),
    SUITE(6000.0);

    private final double pricePerNight;

    RoomCategory(double price) {
        this.pricePerNight = price;
    }

    public double getPricePerNight() {
        return pricePerNight;
    }
}

class Room implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int roomNumber;
    private final RoomCategory category;

    public Room(int roomNumber, RoomCategory category) {
        this.roomNumber = roomNumber;
        this.category = category;
    }

    public int getRoomNumber() {
        return roomNumber;
    }

    public RoomCategory getCategory() {
        return category;
    }

    public double getPricePerNight() {
        return category.getPricePerNight();
    }

    public void display() {
        System.out.printf("Room %-5d %-10s Rs. %.2f per night%n",
                roomNumber, category, getPricePerNight());
    }
}

class Reservation implements Serializable {
    private static final long serialVersionUID = 1L;

    private final int bookingId;
    private final String guestName;
    private final String phone;
    private final int roomNumber;
    private final RoomCategory category;
    private final LocalDate checkIn;
    private final LocalDate checkOut;
    private final double totalAmount;

    private boolean paid;
    private boolean cancelled;

    public Reservation(int bookingId, String guestName, String phone,
                       Room room, LocalDate checkIn, LocalDate checkOut) {
        this.bookingId = bookingId;
        this.guestName = guestName;
        this.phone = phone;
        this.roomNumber = room.getRoomNumber();
        this.category = room.getCategory();
        this.checkIn = checkIn;
        this.checkOut = checkOut;

        long nights = java.time.temporal.ChronoUnit.DAYS.between(
                checkIn, checkOut);

        this.totalAmount = nights * room.getPricePerNight();
        this.paid = false;
        this.cancelled = false;
    }

    public int getBookingId() {
        return bookingId;
    }

    public int getRoomNumber() {
        return roomNumber;
    }

    public LocalDate getCheckIn() {
        return checkIn;
    }

    public LocalDate getCheckOut() {
        return checkOut;
    }

    public boolean isPaid() {
        return paid;
    }

    public boolean isCancelled() {
        return cancelled;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void markPaid() {
        paid = true;
    }

    public void cancel() {
        cancelled = true;
    }

    public void display() {
        System.out.println("----------------------------------------");
        System.out.println("Booking ID : " + bookingId);
        System.out.println("Guest Name : " + guestName);
        System.out.println("Phone      : " + phone);
        System.out.println("Room       : " + roomNumber + " (" + category + ")");
        System.out.println("Check-in   : " + checkIn);
        System.out.println("Check-out  : " + checkOut);

        System.out.printf("Total      : Rs. %.2f%n", totalAmount);

        System.out.println("Payment    : " + (paid ? "PAID" : "PENDING"));
        System.out.println("Status     : " + (cancelled ? "CANCELLED" : "CONFIRMED"));
        System.out.println("----------------------------------------");
    }
}

class Hotel implements Serializable {
    private static final long serialVersionUID = 1L;

    private final List<Room> rooms = new ArrayList<>();
    private final List<Reservation> reservations = new ArrayList<>();

    private int nextBookingId = 1001;

    public Hotel() {
        for (int i = 101; i <= 105; i++) {
            rooms.add(new Room(i, RoomCategory.STANDARD));
        }

        for (int i = 201; i <= 204; i++) {
            rooms.add(new Room(i, RoomCategory.DELUXE));
        }

        for (int i = 301; i <= 302; i++) {
            rooms.add(new Room(i, RoomCategory.SUITE));
        }
    }

    public List<Room> getRooms() {
        return Collections.unmodifiableList(rooms);
    }

    public List<Reservation> getReservations() {
        return Collections.unmodifiableList(reservations);
    }

    public boolean isRoomAvailable(Room room,
                                   LocalDate checkIn,
                                   LocalDate checkOut) {

        for (Reservation reservation : reservations) {

            if (!reservation.isCancelled()
                    && reservation.getRoomNumber() == room.getRoomNumber()) {

                boolean overlaps =
                        checkIn.isBefore(reservation.getCheckOut())
                        && reservation.getCheckIn().isBefore(checkOut);

                if (overlaps) {
                    return false;
                }
            }
        }

        return true;
    }

    public List<Room> searchAvailableRooms(
            RoomCategory category,
            LocalDate checkIn,
            LocalDate checkOut) {

        List<Room> available = new ArrayList<>();

        for (Room room : rooms) {

            if ((category == null || room.getCategory() == category)
                    && isRoomAvailable(room, checkIn, checkOut)) {

                available.add(room);
            }
        }

        return available;
    }

    public Reservation createReservation(
            String guestName,
            String phone,
            Room room,
            LocalDate checkIn,
            LocalDate checkOut) {

        if (!isRoomAvailable(room, checkIn, checkOut)) {
            return null;
        }

        Reservation reservation = new Reservation(
                nextBookingId++,
                guestName,
                phone,
                room,
                checkIn,
                checkOut
        );

        reservations.add(reservation);

        return reservation;
    }

    public Reservation findReservation(int bookingId) {

        for (Reservation reservation : reservations) {

            if (reservation.getBookingId() == bookingId) {
                return reservation;
            }
        }

        return null;
    }

    public boolean cancelReservation(int bookingId) {

        Reservation reservation = findReservation(bookingId);

        if (reservation == null || reservation.isCancelled()) {
            return false;
        }

        reservation.cancel();
        return true;
    }

    public void displayAllRooms() {

        System.out.println("\n========== HOTEL ROOMS ==========");

        for (Room room : rooms) {
            room.display();
        }
    }
}

public class Main {

    private static final String DATA_FILE = "hotel_data.dat";
    private static final Scanner SC = new Scanner(System.in);

    private static Hotel loadHotel() {

        File file = new File(DATA_FILE);

        if (!file.exists()) {
            return new Hotel();
        }

        try (ObjectInputStream input =
                     new ObjectInputStream(
                             new FileInputStream(file))) {

            return (Hotel) input.readObject();

        } catch (IOException | ClassNotFoundException
                 | ClassCastException e) {

            System.out.println(
                    "Saved data could not be loaded. Starting a new hotel record.");

            return new Hotel();
        }
    }

    private static void saveHotel(Hotel hotel) {

        try (ObjectOutputStream output =
                     new ObjectOutputStream(
                             new FileOutputStream(DATA_FILE))) {

            output.writeObject(hotel);

            System.out.println("Hotel data saved successfully.");

        } catch (IOException e) {

            System.out.println("Error saving data: " + e.getMessage());
        }
    }

    private static String readNonEmpty(String prompt) {

        while (true) {

            System.out.print(prompt);

            String value = SC.nextLine().trim();

            if (!value.isEmpty()) {
                return value;
            }

            System.out.println("This field cannot be empty.");
        }
    }

    private static int readInt(String prompt) {

        while (true) {

            System.out.print(prompt);

            String value = SC.nextLine().trim();

            try {
                return Integer.parseInt(value);

            } catch (NumberFormatException e) {

                System.out.println(
                        "Please enter a valid whole number.");
            }
        }
    }

    private static LocalDate readDate(String prompt) {

        while (true) {

            System.out.print(prompt + " (YYYY-MM-DD): ");

            String value = SC.nextLine().trim();

            try {
                return LocalDate.parse(value);

            } catch (DateTimeParseException e) {

                System.out.println(
                        "Invalid date. Example: 2026-12-20");
            }
        }
    }

    private static LocalDate[] readStayDates() {

        while (true) {

            LocalDate checkIn = readDate("Enter check-in date");
            LocalDate checkOut = readDate("Enter check-out date");

            if (checkIn.isBefore(LocalDate.now())) {

                System.out.println(
                        "Check-in date cannot be in the past.");

            } else if (!checkOut.isAfter(checkIn)) {

                System.out.println(
                        "Check-out must be after check-in.");

            } else {

                return new LocalDate[]{checkIn, checkOut};
            }
        }
    }

    private static RoomCategory chooseCategory(boolean allowAll) {

        while (true) {

            System.out.println("\nRoom Categories:");
            System.out.println("1. Standard - Rs. 2,000 per night");
            System.out.println("2. Deluxe   - Rs. 3,500 per night");
            System.out.println("3. Suite    - Rs. 6,000 per night");

            if (allowAll) {
                System.out.println("4. Any category");
            }

            int choice = readInt("Choose category: ");

            switch (choice) {

                case 1:
                    return RoomCategory.STANDARD;

                case 2:
                    return RoomCategory.DELUXE;

                case 3:
                    return RoomCategory.SUITE;

                case 4:
                    if (allowAll) {
                        return null;
                    }
                    break;

                default:
                    break;
            }

            System.out.println("Invalid category choice.");
        }
    }

    private static void searchRooms(Hotel hotel) {

        LocalDate[] dates = readStayDates();

        RoomCategory category = chooseCategory(true);

        List<Room> available = hotel.searchAvailableRooms(
                category, dates[0], dates[1]);

        System.out.println("\n========== AVAILABLE ROOMS ==========");

        if (available.isEmpty()) {

            System.out.println(
                    "No rooms available for the selected dates.");

        } else {

            for (Room room : available) {
                room.display();
            }
        }
    }

    private static void bookRoom(Hotel hotel) {

        LocalDate[] dates = readStayDates();

        RoomCategory category = chooseCategory(true);

        List<Room> available = hotel.searchAvailableRooms(
                category, dates[0], dates[1]);

        if (available.isEmpty()) {

            System.out.println(
                    "No rooms available for those dates.");

            return;
        }

        System.out.println("\nAvailable rooms:");

        for (Room room : available) {
            room.display();
        }

        int roomNumber = readInt(
                "Enter the room number you want to book: ");

        Room selectedRoom = null;

        for (Room room : available) {

            if (room.getRoomNumber() == roomNumber) {
                selectedRoom = room;
                break;
            }
        }

        if (selectedRoom == null) {

            System.out.println(
                    "Invalid selection. Booking not created.");

            return;
        }

        String guestName = readNonEmpty("Enter guest name: ");
        String phone = readNonEmpty("Enter phone number: ");

        Reservation reservation = hotel.createReservation(
                guestName,
                phone,
                selectedRoom,
                dates[0],
                dates[1]
        );

        if (reservation == null) {

            System.out.println(
                    "Sorry, this room is no longer available.");

            return;
        }

        System.out.println(
                "\nBooking created. Please complete simulated payment.");

        reservation.display();

        System.out.printf(
                "Pay Rs. %.2f? (Y/N): ",
                reservation.getTotalAmount());

        String answer = SC.nextLine().trim();

        if (answer.equalsIgnoreCase("Y")) {

            reservation.markPaid();

            System.out.println(
                    "Payment successful (simulation).");

        } else {

            System.out.println(
                    "Payment is pending. Your reservation remains confirmed.");
        }

        reservation.display();

        saveHotel(hotel);
    }

    private static void viewBooking(Hotel hotel) {

        int bookingId = readInt("Enter booking ID: ");

        Reservation reservation =
                hotel.findReservation(bookingId);

        if (reservation == null) {

            System.out.println("Booking not found.");

        } else {

            reservation.display();
        }
    }

    private static void cancelBooking(Hotel hotel) {

        int bookingId = readInt(
                "Enter booking ID to cancel: ");

        Reservation reservation =
                hotel.findReservation(bookingId);

        if (reservation == null) {

            System.out.println("Booking not found.");
            return;
        }

        if (reservation.isCancelled()) {

            System.out.println(
                    "This booking is already cancelled.");

            return;
        }

        reservation.display();

        System.out.print(
                "Are you sure you want to cancel? (Y/N): ");

        String answer = SC.nextLine().trim();

        if (answer.equalsIgnoreCase("Y")) {

            hotel.cancelReservation(bookingId);

            System.out.println(
                    "Booking cancelled successfully.");

            if (reservation.isPaid()) {

                System.out.println(
                        "Refund is not processed; this is a payment simulation.");
            }

            saveHotel(hotel);

        } else {

            System.out.println("Cancellation aborted.");
        }
    }

    private static void viewAllBookings(Hotel hotel) {

        System.out.println("\n========== ALL BOOKINGS ==========");

        if (hotel.getReservations().isEmpty()) {

            System.out.println("No bookings found.");
            return;
        }

        for (Reservation reservation : hotel.getReservations()) {
            reservation.display();
        }
    }

    public static void main(String[] args) {

        Hotel hotel = loadHotel();

        int choice = 0;

        System.out.println(
                "Welcome to the Hotel Reservation System!");

        do {

            System.out.println("\n====================================");
            System.out.println("       HOTEL RESERVATION SYSTEM");
            System.out.println("====================================");
            System.out.println("1. Display All Rooms");
            System.out.println("2. Search Available Rooms");
            System.out.println("3. Book a Room");
            System.out.println("4. View Booking Details");
            System.out.println("5. Cancel Reservation");
            System.out.println("6. View All Bookings");
            System.out.println("7. Save Data");
            System.out.println("8. Exit");
            System.out.println("====================================");

            choice = readInt("Enter your choice: ");

            switch (choice) {

                case 1:
                    hotel.displayAllRooms();
                    break;

                case 2:
                    searchRooms(hotel);
                    break;

                case 3:
                    bookRoom(hotel);
                    break;

                case 4:
                    viewBooking(hotel);
                    break;

                case 5:
                    cancelBooking(hotel);
                    break;

                case 6:
                    viewAllBookings(hotel);
                    break;

                case 7:
                    saveHotel(hotel);
                    break;

                case 8:
                    saveHotel(hotel);

                    System.out.println(
                            "Thank you for using the Hotel Reservation System!");

                    break;

                default:
                    System.out.println(
                            "Invalid choice. Please select 1 to 8.");
            }

        } while (choice != 8);

        SC.close();
    }
}
