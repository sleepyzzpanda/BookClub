/*
Component: generateUserStats
Description: Generates user reading statistics based on a list of read books.
*/

import { fetchBookDetails } from "./fetchBookDetails";

export const generateUserStats = async (readBooks) => {
    const enrichedBooks = await Promise.all(
        readBooks.map(async (b) => {
        const details = await fetchBookDetails(b.title);
        return { ...b, ...details };
        })
    );

    const getTopGenres = (books) => {
        const genreCounts = {};

        books.forEach((b) => {
            const genre = b.genre || "Unknown";
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });

        return Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);
    };

    const getAverageLength = (books) => {
        const totalPages = books.reduce((sum, b) => sum + (b.pages || 0), 0);
        return Math.round(totalPages / books.length);
    };

    const getTotalPagesRead = (books) => {
        return books.reduce((sum, b) => sum + (b.pages || 0), 0);
    };

    return {
        totalBooksRead: enrichedBooks.length,
        totalPagesRead: getTotalPagesRead(enrichedBooks),
        averageBookLength: getAverageLength(enrichedBooks),
        topGenres: getTopGenres(enrichedBooks),
    };
};
