# GetBenefits Courses API

Welcome to the GetBenefits Courses API! This API provides information about available courses along with Udemy coupons.

## Getting Started

### Prerequisites
- Node.js installed on your machine

### Installation
1. Clone this repository.
   ```bash
   git clone https://github.com/well300/udemybot-api/
   ```

2. Install dependencies.
   ```bash
   npm install
   ```

3. Start the server.
   ```bash
   npm start
   ```

## Usage

### Endpoint
The API provides course information at the `/json` endpoint.

Example:
```http
GET http://localhost:3000/json
```

### Response
The response will be in JSON format and contain an array of courses with their titles and Udemy coupon links.

Example:
```json
[
  {
    "title": "Course Title 1",
    "coupon": "https://www.udemy.com/coupon-link-1"
  },
  {
    "title": "Course Title 2",
    "coupon": "https://www.udemy.com/coupon-link-2"
  },
  // ...
]
```

## Examples

### Fetching Courses in JavaScript
```javascript
fetch('http://localhost:3000/json')
  .then(response => response.json())
  .then(courses => {
    console.log('Fetched Courses:', courses);
    // Handle the courses data as needed
  })
  .catch(error => console.error('Error fetching courses:', error));
```

## Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

Remember to replace `<repository_url>` in the installation section with the actual URL of your Git repository. Additionally, update the license information in the license section if needed.
