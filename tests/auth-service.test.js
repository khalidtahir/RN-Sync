import { jest } from '@jest/globals';

const mockSend = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-cognito-identity-provider', () => ({
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: mockSend
    })),
    GetUserCommand: jest.fn()
}));

const { AuthService } = await import('../src/services/auth-service.js');

describe('AuthService', () => {
    let service;

    beforeEach(() => {
        mockSend.mockClear();
        service = new AuthService();
    });

    test('verifyToken returns valid for correct token', async () => {
        mockSend.mockResolvedValue({ Username: 'testuser' });

        const result = await service.verifyToken('valid-token');

        expect(result.valid).toBe(true);
        expect(result.username).toBe('testuser');
    });

    test('verifyToken returns invalid for bad token', async () => {
        mockSend.mockRejectedValue(new Error('Invalid token'));

        const result = await service.verifyToken('invalid-token');

        expect(result.valid).toBe(false);
    });

    test('generatePolicy creates correct policy structure', () => {
        const policy = service.generatePolicy('user1', 'Allow', 'arn:aws:execute-api:...');

        expect(policy.principalId).toBe('user1');
        expect(policy.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(policy.policyDocument.Statement[0].Resource).toBe('arn:aws:execute-api:...');
    });
});
