import { jest } from '@jest/globals';

const mockVerifyToken = jest.fn();
const mockGeneratePolicy = jest.fn();

jest.unstable_mockModule('../src/services/auth-service.js', () => ({
    AuthService: jest.fn().mockImplementation(() => ({
        verifyToken: mockVerifyToken,
        generatePolicy: mockGeneratePolicy
    }))
}));

const { handler } = await import('../src/handlers/auth-handler.js');

describe('Auth Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGeneratePolicy.mockImplementation((principalId, effect, resource) => ({
            principalId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }]
            }
        }));
    });

    const baseEvent = {
        methodArn: 'arn:aws:execute-api:region:acct:api',
        queryStringParameters: {}
    };

    test('denies request when token missing', async () => {
        const response = await handler(baseEvent);

        expect(mockVerifyToken).not.toHaveBeenCalled();
        expect(response.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    test('allows request when token is valid', async () => {
        mockVerifyToken.mockResolvedValue({ valid: true, username: 'nurse' });

        const response = await handler({
            ...baseEvent,
            queryStringParameters: { token: 'abc' }
        });

        expect(mockVerifyToken).toHaveBeenCalledWith('abc');
        expect(response.principalId).toBe('nurse');
        expect(response.policyDocument.Statement[0].Effect).toBe('Allow');
    });

    test('denies request when token invalid', async () => {
        mockVerifyToken.mockResolvedValue({ valid: false });

        const response = await handler({
            ...baseEvent,
            queryStringParameters: { token: 'bad' }
        });

        expect(response.policyDocument.Statement[0].Effect).toBe('Deny');
    });
});

