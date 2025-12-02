export const fetchBookDetails = async (title) => {
    try {
        const query = encodeURIComponent(title);
        const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            return null; // no match
        }

        const book = data.items[0].volumeInfo;

        return {
            title: book.title || "",
            authors: book.authors || [],
            genre: book.categories?.[0] || "Unknown",
            pages: book.pageCount || 0,
            thumbnail: book.imageLinks?.thumbnail || "",
        };

    } catch (error) {
        console.log("Error fetching book:", error);
        return null;
    }
};
