/**
 * Checks if the current time is within a specific time slot.
 * @param {string} startTimeStr - "HH:MM AM/PM"
 * @param {string} endTimeStr - "HH:MM AM/PM"
 * @param {string} dayOfWeek - "Monday", "Tuesday", etc.
 * @param {number} bufferMinutes - Minutes to allow before/after the slot.
 * @returns {boolean}
 */
export const isCurrentTimeInSlot = (startTimeStr, endTimeStr, dayOfWeek, bufferMinutes = 10) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();

    // Check day
    if (days[now.getDay()] !== dayOfWeek) {
        return false;
    }

    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [time, modifier] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':');

        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);

        if (modifier === 'PM' && hours !== 12) {
            hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
            hours = 0;
        }

        return hours * 60 + minutes;
    };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = timeToMinutes(startTimeStr) - bufferMinutes;
    const endMinutes = timeToMinutes(endTimeStr) + bufferMinutes;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};
