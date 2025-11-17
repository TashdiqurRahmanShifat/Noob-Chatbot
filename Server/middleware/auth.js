import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided. Please login.' });
        }

        const token = authHeader.split(' ')[1]; // The token is after 'Bearer '.The token is encrypted.

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name
        };

        next(); // Proceed to next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        return res.status(401).json({ error: 'Invalid token. Please login again.' });
    }
};
