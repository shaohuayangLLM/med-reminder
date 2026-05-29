import Foundation

struct DoseStatus: Equatable {
    var totalDoses: Int
    var usedDoses: Int
    var remainingDoses: Int
    var remainingDays: Int
    var currentDailyDoses: Int
    var estimatedEndDate: String
}

private let utcCalendar: Calendar = {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(secondsFromGMT: 0)!
    return calendar
}()

private func date(from value: String) -> Date {
    var components = DateComponents()
    components.calendar = utcCalendar
    components.timeZone = TimeZone(secondsFromGMT: 0)
    components.year = Int(value.prefix(4))
    components.month = Int(value.dropFirst(5).prefix(2))
    components.day = Int(value.dropFirst(8).prefix(2))
    return utcCalendar.date(from: components) ?? Date(timeIntervalSince1970: 0)
}

private func daysBetween(_ start: String, _ end: String) -> Int {
    let components = utcCalendar.dateComponents([.day], from: date(from: start), to: date(from: end))
    return components.day ?? 0
}

private func addDays(_ value: String, _ days: Int) -> String {
    let next = utcCalendar.date(byAdding: .day, value: days, to: date(from: value)) ?? date(from: value)
    return dateString(from: next)
}

func dateString(from value: Date) -> String {
    let components = utcCalendar.dateComponents([.year, .month, .day], from: value)
    return String(format: "%04d-%02d-%02d", components.year ?? 1970, components.month ?? 1, components.day ?? 1)
}

func todayString() -> String {
    dateString(from: Date())
}

func timestampString() -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return String(formatter.string(from: Date()).prefix(19))
}

func calculateDoseStatus(cartridge: Cartridge, today: String) -> DoseStatus {
    let validAdjustments = cartridge.manualAdjustments
        .filter { $0.date <= today }
        .sorted { $0.date < $1.date }

    let baseDate: String
    let baseDoses: Int

    if let latest = validAdjustments.last {
        baseDate = latest.date
        baseDoses = latest.remainingDoses
    } else {
        baseDate = cartridge.startDate
        baseDoses = cartridge.totalDoses
    }

    let sortedChanges = cartridge.dosageChanges.sorted { $0.date < $1.date }

    var activeDailyDoses = 0
    for change in sortedChanges where change.date <= baseDate {
        activeDailyDoses = change.dailyDoses
    }

    var usedSinceBase = 0
    var segmentStart = baseDate
    var currentRate = activeDailyDoses

    for change in sortedChanges where change.date > baseDate && change.date <= today {
        usedSinceBase += daysBetween(segmentStart, change.date) * currentRate
        segmentStart = change.date
        currentRate = change.dailyDoses
    }

    usedSinceBase += daysBetween(segmentStart, today) * currentRate

    let remainingDoses = max(0, baseDoses - usedSinceBase)

    var currentDailyDoses = 0
    for change in sortedChanges where change.date <= today {
        currentDailyDoses = change.dailyDoses
    }

    let remainingDays = currentDailyDoses > 0 ? remainingDoses / currentDailyDoses : 0
    let usedDoses = cartridge.totalDoses - remainingDoses

    return DoseStatus(
        totalDoses: cartridge.totalDoses,
        usedDoses: usedDoses,
        remainingDoses: remainingDoses,
        remainingDays: remainingDays,
        currentDailyDoses: currentDailyDoses,
        estimatedEndDate: addDays(today, remainingDays)
    )
}
