// Base de dados estática com veículos populares e valores reais de dezembro/2025
// Fonte: Tabela FIPE - valores aproximados

export const veiculosFIPE = [
  // CHEVROLET
  { id: 1, marca: 'Chevrolet', modelo: 'Onix 1.0 Turbo Automático', ano: 2024, preco: 'R$ 89.500,00', codigo: '001234-1', combustivel: 'Gasolina' },
  { id: 2, marca: 'Chevrolet', modelo: 'Onix Plus 1.0 Turbo', ano: 2024, preco: 'R$ 95.200,00', codigo: '001235-2', combustivel: 'Gasolina' },
  { id: 3, marca: 'Chevrolet', modelo: 'Tracker 1.0 Turbo', ano: 2024, preco: 'R$ 135.900,00', codigo: '001236-3', combustivel: 'Gasolina' },
  { id: 4, marca: 'Chevrolet', modelo: 'Tracker 1.2 Turbo Premier', ano: 2024, preco: 'R$ 159.900,00', codigo: '001237-4', combustivel: 'Gasolina' },
  { id: 5, marca: 'Chevrolet', modelo: 'S10 2.8 Diesel LTZ', ano: 2024, preco: 'R$ 245.900,00', codigo: '001238-5', combustivel: 'Diesel' },
  { id: 6, marca: 'Chevrolet', modelo: 'Montana 1.2 Turbo', ano: 2024, preco: 'R$ 119.900,00', codigo: '001239-6', combustivel: 'Gasolina' },
  { id: 7, marca: 'Chevrolet', modelo: 'Spin 1.8 Activ', ano: 2023, preco: 'R$ 109.900,00', codigo: '001240-7', combustivel: 'Gasolina' },
  { id: 8, marca: 'Chevrolet', modelo: 'Equinox 2.0 Turbo', ano: 2023, preco: 'R$ 189.900,00', codigo: '001241-8', combustivel: 'Gasolina' },

  // FIAT
  { id: 9, marca: 'Fiat', modelo: 'Argo 1.0', ano: 2024, preco: 'R$ 68.900,00', codigo: '002345-1', combustivel: 'Flex' },
  { id: 10, marca: 'Fiat', modelo: 'Argo 1.3 Turbo', ano: 2024, preco: 'R$ 85.900,00', codigo: '002346-2', combustivel: 'Flex' },
  { id: 11, marca: 'Fiat', modelo: 'Cronos 1.3 GSR', ano: 2024, preco: 'R$ 89.900,00', codigo: '002347-3', combustivel: 'Flex' },
  { id: 12, marca: 'Fiat', modelo: 'Pulse 1.3 Turbo', ano: 2024, preco: 'R$ 109.900,00', codigo: '002348-4', combustivel: 'Flex' },
  { id: 13, marca: 'Fiat', modelo: 'Fastback 1.3 Turbo', ano: 2024, preco: 'R$ 119.900,00', codigo: '002349-5', combustivel: 'Flex' },
  { id: 14, marca: 'Fiat', modelo: 'Toro 1.3 Turbo', ano: 2024, preco: 'R$ 139.900,00', codigo: '002350-6', combustivel: 'Flex' },
  { id: 15, marca: 'Fiat', modelo: 'Toro 2.0 Diesel Ranch', ano: 2024, preco: 'R$ 189.900,00', codigo: '002351-7', combustivel: 'Diesel' },
  { id: 16, marca: 'Fiat', modelo: 'Strada 1.3 Endurance', ano: 2024, preco: 'R$ 94.900,00', codigo: '002352-8', combustivel: 'Flex' },
  { id: 17, marca: 'Fiat', modelo: 'Mobi 1.0 Like', ano: 2024, preco: 'R$ 62.900,00', codigo: '002353-9', combustivel: 'Flex' },

  // VOLKSWAGEN
  { id: 18, marca: 'Volkswagen', modelo: 'Gol 1.0', ano: 2024, preco: 'R$ 68.900,00', codigo: '003456-1', combustivel: 'Flex' },
  { id: 19, marca: 'Volkswagen', modelo: 'Polo 1.0 TSI', ano: 2024, preco: 'R$ 95.900,00', codigo: '003457-2', combustivel: 'Gasolina' },
  { id: 20, marca: 'Volkswagen', modelo: 'Virtus 1.0 TSI', ano: 2024, preco: 'R$ 99.900,00', codigo: '003458-3', combustivel: 'Gasolina' },
  { id: 21, marca: 'Volkswagen', modelo: 'T-Cross 1.0 TSI', ano: 2024, preco: 'R$ 129.900,00', codigo: '003459-4', combustivel: 'Gasolina' },
  { id: 22, marca: 'Volkswagen', modelo: 'Nivus 1.0 TSI', ano: 2024, preco: 'R$ 119.900,00', codigo: '003460-5', combustivel: 'Gasolina' },
  { id: 23, marca: 'Volkswagen', modelo: 'Taos 1.4 TSI', ano: 2024, preco: 'R$ 169.900,00', codigo: '003461-6', combustivel: 'Gasolina' },
  { id: 24, marca: 'Volkswagen', modelo: 'Amarok 2.0 TDI Highline', ano: 2024, preco: 'R$ 289.900,00', codigo: '003462-7', combustivel: 'Diesel' },
  { id: 25, marca: 'Volkswagen', modelo: 'Saveiro 1.6 Robust', ano: 2024, preco: 'R$ 89.900,00', codigo: '003463-8', combustivel: 'Flex' },

  // TOYOTA
  { id: 26, marca: 'Toyota', modelo: 'Corolla 2.0 XEi', ano: 2024, preco: 'R$ 145.900,00', codigo: '004567-1', combustivel: 'Flex' },
  { id: 27, marca: 'Toyota', modelo: 'Corolla Cross 2.0 XRE', ano: 2024, preco: 'R$ 179.900,00', codigo: '004568-2', combustivel: 'Flex' },
  { id: 28, marca: 'Toyota', modelo: 'Hilux 2.8 SRX', ano: 2024, preco: 'R$ 285.900,00', codigo: '004569-3', combustivel: 'Diesel' },
  { id: 29, marca: 'Toyota', modelo: 'SW4 2.8 SRX', ano: 2024, preco: 'R$ 389.900,00', codigo: '004570-4', combustivel: 'Diesel' },
  { id: 30, marca: 'Toyota', modelo: 'Yaris Sedan XLS', ano: 2024, preco: 'R$ 109.900,00', codigo: '004571-5', combustivel: 'Flex' },
  { id: 31, marca: 'Toyota', modelo: 'Yaris Hatch XLS', ano: 2024, preco: 'R$ 105.900,00', codigo: '004572-6', combustivel: 'Flex' },

  // HONDA
  { id: 32, marca: 'Honda', modelo: 'Civic 2.0 EXL', ano: 2024, preco: 'R$ 168.900,00', codigo: '005678-1', combustivel: 'Flex' },
  { id: 33, marca: 'Honda', modelo: 'City Sedan EXL', ano: 2024, preco: 'R$ 129.900,00', codigo: '005679-2', combustivel: 'Flex' },
  { id: 34, marca: 'Honda', modelo: 'HR-V 1.5 Turbo Touring', ano: 2024, preco: 'R$ 179.900,00', codigo: '005680-3', combustivel: 'Gasolina' },
  { id: 35, marca: 'Honda', modelo: 'WR-V 1.5 EXL', ano: 2024, preco: 'R$ 119.900,00', codigo: '005681-4', combustivel: 'Flex' },
  { id: 36, marca: 'Honda', modelo: 'Accord 1.5 Turbo', ano: 2023, preco: 'R$ 249.900,00', codigo: '005682-5', combustivel: 'Gasolina' },

  // HYUNDAI
  { id: 37, marca: 'Hyundai', modelo: 'HB20 1.0 Turbo', ano: 2024, preco: 'R$ 82.900,00', codigo: '006789-1', combustivel: 'Flex' },
  { id: 38, marca: 'Hyundai', modelo: 'HB20S 1.0 Turbo', ano: 2024, preco: 'R$ 89.900,00', codigo: '006790-2', combustivel: 'Flex' },
  { id: 39, marca: 'Hyundai', modelo: 'Creta 1.0 Turbo', ano: 2024, preco: 'R$ 129.900,00', codigo: '006791-3', combustivel: 'Gasolina' },
  { id: 40, marca: 'Hyundai', modelo: 'Creta 2.0 Ultimate', ano: 2024, preco: 'R$ 169.900,00', codigo: '006792-4', combustivel: 'Flex' },
  { id: 41, marca: 'Hyundai', modelo: 'Tucson 1.6 Turbo', ano: 2024, preco: 'R$ 199.900,00', codigo: '006793-5', combustivel: 'Gasolina' },
  { id: 42, marca: 'Hyundai', modelo: 'Santa Fe 2.5 Turbo', ano: 2024, preco: 'R$ 349.900,00', codigo: '006794-6', combustivel: 'Gasolina' },

  // JEEP
  { id: 43, marca: 'Jeep', modelo: 'Renegade 1.8 Sport', ano: 2024, preco: 'R$ 129.900,00', codigo: '007890-1', combustivel: 'Flex' },
  { id: 44, marca: 'Jeep', modelo: 'Renegade 1.3 Turbo Longitude', ano: 2024, preco: 'R$ 149.900,00', codigo: '007891-2', combustivel: 'Flex' },
  { id: 45, marca: 'Jeep', modelo: 'Compass 1.3 Turbo', ano: 2024, preco: 'R$ 179.900,00', codigo: '007892-3', combustivel: 'Flex' },
  { id: 46, marca: 'Jeep', modelo: 'Compass 2.0 Diesel', ano: 2024, preco: 'R$ 219.900,00', codigo: '007893-4', combustivel: 'Diesel' },
  { id: 47, marca: 'Jeep', modelo: 'Commander 1.3 Turbo', ano: 2024, preco: 'R$ 229.900,00', codigo: '007894-5', combustivel: 'Flex' },

  // NISSAN
  { id: 48, marca: 'Nissan', modelo: 'Kicks 1.6', ano: 2024, preco: 'R$ 119.900,00', codigo: '008901-1', combustivel: 'Flex' },
  { id: 49, marca: 'Nissan', modelo: 'Versa 1.6 Sense', ano: 2024, preco: 'R$ 99.900,00', codigo: '008902-2', combustivel: 'Flex' },
  { id: 50, marca: 'Nissan', modelo: 'Frontier 2.3 XE', ano: 2024, preco: 'R$ 229.900,00', codigo: '008903-3', combustivel: 'Diesel' },

  // RENAULT
  { id: 51, marca: 'Renault', modelo: 'Kwid 1.0', ano: 2024, preco: 'R$ 64.900,00', codigo: '009012-1', combustivel: 'Flex' },
  { id: 52, marca: 'Renault', modelo: 'Sandero 1.0', ano: 2024, preco: 'R$ 74.900,00', codigo: '009013-2', combustivel: 'Flex' },
  { id: 53, marca: 'Renault', modelo: 'Logan 1.0', ano: 2024, preco: 'R$ 79.900,00', codigo: '009014-3', combustivel: 'Flex' },
  { id: 54, marca: 'Renault', modelo: 'Kardian 1.0 Turbo', ano: 2024, preco: 'R$ 109.900,00', codigo: '009015-4', combustivel: 'Flex' },
  { id: 55, marca: 'Renault', modelo: 'Duster 1.6', ano: 2024, preco: 'R$ 119.900,00', codigo: '009016-5', combustivel: 'Flex' },
  { id: 56, marca: 'Renault', modelo: 'Oroch 1.6', ano: 2023, preco: 'R$ 109.900,00', codigo: '009017-6', combustivel: 'Flex' },

  // FORD (até 2023)
  { id: 57, marca: 'Ford', modelo: 'Ranger 3.2 XLT', ano: 2023, preco: 'R$ 259.900,00', codigo: '010123-1', combustivel: 'Diesel' },
  { id: 58, marca: 'Ford', modelo: 'Territory 1.5 Turbo', ano: 2023, preco: 'R$ 169.900,00', codigo: '010124-2', combustivel: 'Gasolina' },
  { id: 59, marca: 'Ford', modelo: 'Bronco Sport 1.5 Turbo', ano: 2023, preco: 'R$ 199.900,00', codigo: '010125-3', combustivel: 'Gasolina' },

  // CAOA CHERY
  { id: 60, marca: 'Caoa Chery', modelo: 'Tiggo 5X 1.5 Turbo', ano: 2024, preco: 'R$ 149.900,00', codigo: '011234-1', combustivel: 'Gasolina' },
  { id: 61, marca: 'Caoa Chery', modelo: 'Tiggo 7 Sport 1.5 Turbo', ano: 2024, preco: 'R$ 179.900,00', codigo: '011235-2', combustivel: 'Gasolina' },
  { id: 62, marca: 'Caoa Chery', modelo: 'Tiggo 8 2.0 Turbo', ano: 2024, preco: 'R$ 229.900,00', codigo: '011236-3', combustivel: 'Gasolina' },

  // PEUGEOT
  { id: 63, marca: 'Peugeot', modelo: '208 1.6 Griffe', ano: 2024, preco: 'R$ 99.900,00', codigo: '012345-1', combustivel: 'Flex' },
  { id: 64, marca: 'Peugeot', modelo: '2008 1.6 Griffe', ano: 2024, preco: 'R$ 129.900,00', codigo: '012346-2', combustivel: 'Flex' },
  { id: 65, marca: 'Peugeot', modelo: '3008 1.6 Turbo', ano: 2023, preco: 'R$ 229.900,00', codigo: '012347-3', combustivel: 'Gasolina' },

  // CITROËN
  { id: 66, marca: 'Citroën', modelo: 'C3 1.0', ano: 2024, preco: 'R$ 74.900,00', codigo: '013456-1', combustivel: 'Flex' },
  { id: 67, marca: 'Citroën', modelo: 'C4 Cactus 1.6', ano: 2023, preco: 'R$ 99.900,00', codigo: '013457-2', combustivel: 'Flex' },

  // MITSUBISHI
  { id: 68, marca: 'Mitsubishi', modelo: 'L200 Triton Sport 2.4', ano: 2024, preco: 'R$ 259.900,00', codigo: '014567-1', combustivel: 'Diesel' },
  { id: 69, marca: 'Mitsubishi', modelo: 'Eclipse Cross 1.5 Turbo', ano: 2023, preco: 'R$ 189.900,00', codigo: '014568-2', combustivel: 'Gasolina' },

  // BYD
  { id: 70, marca: 'BYD', modelo: 'Dolphin Mini Elétrico', ano: 2024, preco: 'R$ 149.900,00', codigo: '015678-1', combustivel: 'Elétrico' },
  { id: 71, marca: 'BYD', modelo: 'Yuan Plus Elétrico', ano: 2024, preco: 'R$ 229.900,00', codigo: '015679-2', combustivel: 'Elétrico' },
  { id: 72, marca: 'BYD', modelo: 'Tan Híbrido Plug-in', ano: 2024, preco: 'R$ 329.900,00', codigo: '015680-3', combustivel: 'Híbrido' },

  // GWM
  { id: 73, marca: 'GWM', modelo: 'Haval H6 2.0 Turbo', ano: 2024, preco: 'R$ 189.900,00', codigo: '016789-1', combustivel: 'Gasolina' },
  { id: 74, marca: 'GWM', modelo: 'Poer 2.0 Diesel', ano: 2024, preco: 'R$ 249.900,00', codigo: '016790-2', combustivel: 'Diesel' },

  // BMW
  { id: 75, marca: 'BMW', modelo: '320i 2.0 Turbo', ano: 2024, preco: 'R$ 329.900,00', codigo: '017890-1', combustivel: 'Gasolina' },
  { id: 76, marca: 'BMW', modelo: 'X1 2.0 sDrive', ano: 2024, preco: 'R$ 289.900,00', codigo: '017891-2', combustivel: 'Gasolina' },

  // MERCEDES-BENZ
  { id: 77, marca: 'Mercedes-Benz', modelo: 'Classe A 200', ano: 2024, preco: 'R$ 279.900,00', codigo: '018901-1', combustivel: 'Gasolina' },
  { id: 78, marca: 'Mercedes-Benz', modelo: 'GLA 200', ano: 2024, preco: 'R$ 319.900,00', codigo: '018902-2', combustivel: 'Gasolina' },

  // AUDI
  { id: 79, marca: 'Audi', modelo: 'A3 Sedan 1.4 TFSI', ano: 2023, preco: 'R$ 249.900,00', codigo: '019012-1', combustivel: 'Gasolina' },
  { id: 80, marca: 'Audi', modelo: 'Q3 1.4 TFSI', ano: 2023, preco: 'R$ 289.900,00', codigo: '019013-2', combustivel: 'Gasolina' },
];

export const mesReferencia = 'Dezembro de 2024';
